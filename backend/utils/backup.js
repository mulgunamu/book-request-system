const fs = require('fs').promises;
const path = require('path');

class BackupManager {
    constructor() {
        this.backupDir = path.join(__dirname, '../data/backups');
        this.dataDir = path.join(__dirname, '../data');
        this.maxBackups = 50; // 최대 50개 백업 보관 (증가)
        
        // 백업할 파일들
        this.backupTargets = [
            'owned-books.json',
            'classes.json', 
            'applications.json',
            'api-keys.json',
            'admin.json',
            'budgets.json',
            'system-config.json'
        ];
        
        // 자동 백업 스케줄러
        this.scheduledBackupInterval = null;
        this.startScheduledBackups();
    }

    // 백업 디렉토리 초기화
    async initializeBackupDir() {
        try {
            await fs.access(this.backupDir);
        } catch (error) {
            await fs.mkdir(this.backupDir, { recursive: true });
            console.log('백업 디렉토리가 생성되었습니다:', this.backupDir);
        }
    }

    // 자동 백업 스케줄 시작
    startScheduledBackups() {
        // 매 6시간마다 자동 백업 (6시간 = 6 * 60 * 60 * 1000ms)
        this.scheduledBackupInterval = setInterval(async () => {
            try {
                await this.createManualBackup('정기 자동백업');
                console.log('⏰ 정기 자동백업 완료');
            } catch (error) {
                console.error('⏰ 정기 자동백업 실패:', error);
            }
        }, 6 * 60 * 60 * 1000);
        
        console.log('⏰ 자동 백업 스케줄러 시작됨 (6시간 간격)');
    }

    // 자동 백업 스케줄 중지
    stopScheduledBackups() {
        if (this.scheduledBackupInterval) {
            clearInterval(this.scheduledBackupInterval);
            this.scheduledBackupInterval = null;
            console.log('⏰ 자동 백업 스케줄러 중지됨');
        }
    }

    // 자동 백업 (데이터 변경 시 호출)
    async createAutoBackup(changedFile, reason = 'auto') {
        await this.initializeBackupDir();
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `${timestamp}_${reason}_${changedFile.replace('.json', '')}`;
        const backupPath = path.join(this.backupDir, backupName);
        
        try {
            // 단일 파일 백업
            const sourceFile = path.join(this.dataDir, changedFile);
            const targetFile = path.join(backupPath, changedFile);
            
            await fs.mkdir(backupPath, { recursive: true });
            await fs.copyFile(sourceFile, targetFile);
            
            // 백업 메타데이터 저장
            const metadata = {
                timestamp: new Date().toISOString(),
                type: 'auto',
                reason,
                files: [changedFile],
                triggeredBy: changedFile
            };
            
            await fs.writeFile(
                path.join(backupPath, 'backup-info.json'), 
                JSON.stringify(metadata, null, 2)
            );
            
            console.log(`✅ 자동 백업 생성: ${backupName}`);
            
            // 오래된 백업 정리
            await this.cleanOldBackups();
            
            return backupName;
        } catch (error) {
            console.error('자동 백업 생성 실패:', error);
            throw error;
        }
    }

    // 수동 전체 백업
    async createManualBackup(description = '') {
        await this.initializeBackupDir();
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `${timestamp}_manual_full`;
        const backupPath = path.join(this.backupDir, backupName);
        
        try {
            await fs.mkdir(backupPath, { recursive: true });
            
            const backedUpFiles = [];
            
            // 모든 대상 파일 백업
            for (const file of this.backupTargets) {
                const sourceFile = path.join(this.dataDir, file);
                const targetFile = path.join(backupPath, file);
                
                try {
                    await fs.access(sourceFile);
                    await fs.copyFile(sourceFile, targetFile);
                    backedUpFiles.push(file);
                } catch (error) {
                    console.log(`파일 없음 (건너뜀): ${file}`);
                }
            }
            
            // 백업 메타데이터 저장
            const metadata = {
                timestamp: new Date().toISOString(),
                type: 'manual',
                description,
                files: backedUpFiles,
                totalFiles: backedUpFiles.length
            };
            
            await fs.writeFile(
                path.join(backupPath, 'backup-info.json'), 
                JSON.stringify(metadata, null, 2)
            );
            
            console.log(`✅ 수동 백업 생성: ${backupName} (${backedUpFiles.length}개 파일)`);
            
            // 오래된 백업 정리
            await this.cleanOldBackups();
            
            return {
                name: backupName,
                timestamp: metadata.timestamp,
                files: backedUpFiles,
                description
            };
        } catch (error) {
            console.error('수동 백업 생성 실패:', error);
            throw error;
        }
    }

    // 백업 목록 조회
    async getBackupList() {
        await this.initializeBackupDir();
        
        try {
            const backupFolders = await fs.readdir(this.backupDir);
            const backups = [];
            
            for (const folder of backupFolders) {
                const backupPath = path.join(this.backupDir, folder);
                const metadataPath = path.join(backupPath, 'backup-info.json');
                
                try {
                    const stats = await fs.stat(backupPath);
                    if (!stats.isDirectory()) continue;
                    
                    const metadataContent = await fs.readFile(metadataPath, 'utf8');
                    const metadata = JSON.parse(metadataContent);
                    
                    backups.push({
                        name: folder,
                        ...metadata,
                        size: await this.getBackupSize(backupPath)
                    });
                } catch (error) {
                    console.error(`백업 메타데이터 읽기 실패: ${folder}`, error);
                }
            }
            
            // 최신순 정렬
            backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return backups;
        } catch (error) {
            console.error('백업 목록 조회 실패:', error);
            return [];
        }
    }

    // 백업 복원
    async restoreBackup(backupName, selectedFiles = null) {
        const backupPath = path.join(this.backupDir, backupName);
        
        try {
            // 백업 존재 확인
            await fs.access(backupPath);
            
            const metadataPath = path.join(backupPath, 'backup-info.json');
            const metadataContent = await fs.readFile(metadataPath, 'utf8');
            const metadata = JSON.parse(metadataContent);
            
            // 복원 전 현재 상태 백업
            await this.createManualBackup(`복원 전 자동백업 (${backupName} 복원)`);
            
            const filesToRestore = selectedFiles || metadata.files;
            const restoredFiles = [];
            
            for (const file of filesToRestore) {
                const sourceFile = path.join(backupPath, file);
                const targetFile = path.join(this.dataDir, file);
                
                try {
                    await fs.access(sourceFile);
                    await fs.copyFile(sourceFile, targetFile);
                    restoredFiles.push(file);
                    console.log(`✅ 복원 완료: ${file}`);
                } catch (error) {
                    console.error(`복원 실패: ${file}`, error);
                }
            }
            
            console.log(`🎉 백업 복원 완료: ${backupName} (${restoredFiles.length}개 파일)`);
            
            return {
                success: true,
                restoredFiles,
                totalFiles: filesToRestore.length
            };
        } catch (error) {
            console.error('백업 복원 실패:', error);
            throw error;
        }
    }

    // 백업 삭제
    async deleteBackup(backupName) {
        const backupPath = path.join(this.backupDir, backupName);
        
        try {
            await this.deleteDirectory(backupPath);
            console.log(`🗑️ 백업 삭제 완료: ${backupName}`);
            return true;
        } catch (error) {
            console.error('백업 삭제 실패:', error);
            throw error;
        }
    }

    // 오래된 백업 정리
    async cleanOldBackups() {
        try {
            const backups = await this.getBackupList();
            
            if (backups.length > this.maxBackups) {
                const backupsToDelete = backups.slice(this.maxBackups);
                
                for (const backup of backupsToDelete) {
                    await this.deleteBackup(backup.name);
                }
                
                console.log(`🧹 오래된 백업 ${backupsToDelete.length}개 정리 완료`);
            }
        } catch (error) {
            console.error('오래된 백업 정리 실패:', error);
        }
    }

    // 백업 크기 계산
    async getBackupSize(backupPath) {
        try {
            const files = await fs.readdir(backupPath);
            let totalSize = 0;
            
            for (const file of files) {
                const filePath = path.join(backupPath, file);
                const stats = await fs.stat(filePath);
                totalSize += stats.size;
            }
            
            return totalSize;
        } catch (error) {
            return 0;
        }
    }

    // 디렉토리 재귀 삭제
    async deleteDirectory(dirPath) {
        try {
            const files = await fs.readdir(dirPath);
            
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);
                
                if (stats.isDirectory()) {
                    await this.deleteDirectory(filePath);
                } else {
                    await fs.unlink(filePath);
                }
            }
            
            await fs.rmdir(dirPath);
        } catch (error) {
            throw error;
        }
    }

    // 중요 변경 시 즉시 백업
    async createCriticalBackup(changedFiles, reason = 'critical_change') {
        await this.initializeBackupDir();
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `${timestamp}_critical_${reason}`;
        const backupPath = path.join(this.backupDir, backupName);
        
        try {
            await fs.mkdir(backupPath, { recursive: true });
            
            const backedUpFiles = [];
            const filesToBackup = Array.isArray(changedFiles) ? changedFiles : [changedFiles];
            
            // 변경된 파일들과 관련 파일들 백업
            for (const file of filesToBackup) {
                if (this.backupTargets.includes(file)) {
                    const sourceFile = path.join(this.dataDir, file);
                    const targetFile = path.join(backupPath, file);
                    
                    try {
                        await fs.access(sourceFile);
                        await fs.copyFile(sourceFile, targetFile);
                        backedUpFiles.push(file);
                    } catch (error) {
                        console.log(`중요 백업 - 파일 없음 (건너뜀): ${file}`);
                    }
                }
            }
            
            // 백업 메타데이터 저장
            const metadata = {
                timestamp: new Date().toISOString(),
                type: 'critical',
                reason,
                files: backedUpFiles,
                triggeredBy: filesToBackup,
                priority: 'high'
            };
            
            await fs.writeFile(
                path.join(backupPath, 'backup-info.json'), 
                JSON.stringify(metadata, null, 2)
            );
            
            console.log(`🚨 중요 백업 생성: ${backupName} (${backedUpFiles.length}개 파일)`);
            
            return backupName;
        } catch (error) {
            console.error('중요 백업 생성 실패:', error);
            throw error;
        }
    }
}

// 전역 백업 매니저 인스턴스
const backupManager = new BackupManager();

// 데이터 쓰기 함수 래핑 (자동 백업 포함)
async function writeDataWithBackup(dataType, data, reason = 'update') {
    const fileMap = {
        'applications': 'applications.json',
        'classes': 'classes.json',
        'budgets': 'budgets.json',
        'ownedBooks': 'owned-books.json',
        'apiKeys': 'api-keys.json',
        'admin': 'admin.json'
    };
    
    const fileName = fileMap[dataType];
    if (!fileName) {
        throw new Error(`알 수 없는 데이터 타입: ${dataType}`);
    }
    
    try {
        // 기존 writeData 호출
        const success = await global.writeData(dataType, data);
        
        if (success) {
            // 자동 백업 생성
            await backupManager.createAutoBackup(fileName, reason);
        }
        
        return success;
    } catch (error) {
        console.error(`백업 포함 데이터 쓰기 실패 (${dataType}):`, error);
        throw error;
    }
}

module.exports = {
    BackupManager,
    backupManager,
    writeDataWithBackup
}; 