/**
 * aladin-api.js
 * 알라딘 API와 연동하여 장바구니 정보를 가져오는 모듈
 */

const AladinAPI = (() => {
    // 프라이빗 변수 및 메서드
    const API_BASE_URL = 'https://www.aladin.co.kr/ttb/api/';
    
    /**
     * 알라딘 장바구니 URL에서 필요한 정보를 추출하는 함수
     * @param {string} url - 알라딘 장바구니 URL
     * @returns {object|null} - 추출된 정보 객체 또는 오류 시 null
     */
    const parseCartURL = (url) => {
        try {
            // URL이 유효한지 확인
            if (!url || !url.includes('www.aladin.co.kr/shop/wbasket.aspx')) {
                throw new Error('유효한 알라딘 장바구니 URL이 아닙니다.');
            }
            
            // URL에서 필요한 파라미터 추출 (예: 세션 ID 등)
            const urlObj = new URL(url);
            const sessionId = urlObj.searchParams.get('SessionId');
            
            // 세션 ID가 없어도 통과하도록 주석 처리 또는 완화
            // if (!sessionId) {
            //     throw new Error('장바구니 세션 정보를 찾을 수 없습니다.');
            // }
            
            return {
                sessionId,
                domain: urlObj.hostname
            };
        } catch (error) {
            console.error('장바구니 URL 파싱 오류:', error);
            throw error;
        }
    };
    
    /**
     * 장바구니 HTML에서 도서 정보를 추출하는 함수
     * @param {string} html - 장바구니 페이지 HTML
     * @returns {array} - 추출된 도서 정보 배열
     */
    const extractBooksFromCartHtml = (html) => {
        try {
            // HTML 파싱을 위한 임시 DOM 요소 생성
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // 장바구니 항목 컨테이너 선택
            const cartItems = doc.querySelectorAll('.cart_item_row');
            
            if (!cartItems || cartItems.length === 0) {
                throw new Error('장바구니에서 도서 정보를 찾을 수 없습니다.');
            }
            
            // 각 장바구니 항목에서 도서 정보 추출
            const books = Array.from(cartItems).map(item => {
                // 도서 ID 추출
                const bookIdEl = item.querySelector('[name="itemId"]');
                const bookId = bookIdEl ? bookIdEl.value : '';
                
                // 도서명 추출
                const titleEl = item.querySelector('.list_rep a.bo3');
                const title = titleEl ? titleEl.textContent.trim() : '';
                
                // 저자 및 출판사 정보 추출
                const infoEl = item.querySelector('.info_list');
                let author = '', publisher = '';
                
                if (infoEl) {
                    const infoText = infoEl.textContent;
                    const authorMatch = infoText.match(/저자 : ([^|]+)/);
                    author = authorMatch ? authorMatch[1].trim() : '';
                    
                    const publisherMatch = infoText.match(/출판사 : ([^|]+)/);
                    publisher = publisherMatch ? publisherMatch[1].trim() : '';
                }
                
                // 가격 정보 추출 (할인 전 가격)
                const priceEl = item.querySelector('.o_price');
                let price = 0;
                
                if (priceEl) {
                    const priceText = priceEl.textContent.replace(/[^0-9]/g, '');
                    price = parseInt(priceText, 10) || 0;
                }
                
                // 이미지 URL 추출
                const imageEl = item.querySelector('.imgSet img');
                const imageUrl = imageEl ? imageEl.src : '';
                
                return {
                    id: bookId,
                    title,
                    author,
                    publisher,
                    price,
                    imageUrl,
                    isDuplicate: false, // 중복 여부는 나중에 체크
                    selected: true // 기본적으로 모두 선택
                };
            });
            
            return books;
        } catch (error) {
            console.error('장바구니 HTML 파싱 오류:', error);
            throw error;
        }
    };
    
    /**
     * CORS 우회를 위한 프록시 서버 URL
     * 실제 구현 시에는 서버 측에서 처리하는 것이 좋음
     */
    const PROXY_URL = 'https://kooboom.dothome.co.kr/book-request-system/aladin-proxy.php?url=';
    
    // 퍼블릭 메서드
    return {
        /**
         * 알라딘 장바구니에서 도서 정보를 가져오는 함수
         * @param {string} cartUrl - 알라딘 장바구니 URL
         * @returns {Promise<array>} - 도서 정보 배열을 담은 Promise
         */
        fetchCartItems: async (cartUrl) => {
            try {
                // URL 파싱
                const urlInfo = parseCartURL(cartUrl);
                
                // 장바구니 페이지를 직접 가져옴 (CORS 문제로 실제 구현 시 서버 측에서 처리 필요)
                const response = await fetch(`${PROXY_URL}${cartUrl}`, {
                    method: 'GET',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('장바구니 정보를 가져오는데 실패했습니다.');
                }
                
                const html = await response.text();
                
                // HTML에서 도서 정보 추출
                const books = extractBooksFromCartHtml(html);
                
                return books;
            } catch (error) {
                console.error('알라딘 장바구니 가져오기 오류:', error);
                throw error;
            }
        },
        
        /**
         * 도서 상세 정보를 가져오는 함수 (추가 정보가 필요한 경우)
         * @param {string} bookId - 알라딘 도서 ID
         * @returns {Promise<object>} - 도서 상세 정보를 담은 Promise
         */
        fetchBookDetails: async (bookId) => {
            try {
                // API 키는 실제 구현 시 서버에서 관리해야 함
                const TTB_KEY = 'YOUR_ALADIN_TTB_KEY';
                
                const url = `${API_BASE_URL}ItemLookUp.aspx?ttbkey=${TTB_KEY}&itemIdType=ISBN&ItemId=${bookId}&output=js&Version=20131101`;
                
                const response = await fetch(`${PROXY_URL}${url}`);
                
                if (!response.ok) {
                    throw new Error('도서 상세 정보를 가져오는데 실패했습니다.');
                }
                
                const data = await response.json();
                
                if (!data.item || data.item.length === 0) {
                    throw new Error('도서 정보가 없습니다.');
                }
                
                return data.item[0];
            } catch (error) {
                console.error('도서 상세 정보 가져오기 오류:', error);
                throw error;
            }
        },
        
        /**
         * 알라딘 장바구니 URL인지 확인하는 함수
         * @param {string} url - 확인할 URL
         * @returns {boolean} - 유효한 알라딘 장바구니 URL인지 여부
         */
        isValidCartURL: (url) => {
            try {
                url = url.trim();
                return /^https?:\/\/www\.aladin\.co\.kr\/shop\/wbasket\.aspx(\?.*)?$/i.test(url);
            } catch (error) {
                return false;
            }
        }
    };
})();

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AladinAPI;
}