const fs = require('fs');
const path = require('path');
const os = require('os');

class ProjectLocker {
    static getLockFilePath(repoId) {
        const lockDir = path.join(os.homedir(), '.codeatlas', 'locks');
        if (!fs.existsSync(lockDir)) {
            fs.mkdirSync(lockDir, { recursive: true });
        }
        return path.join(lockDir, `${repoId}.lock`);
    }

    static acquireLock(repoId) {
        const lockFile = this.getLockFilePath(repoId);
        if (fs.existsSync(lockFile)) {
            const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
            // Stale lock check (older than 10 minutes)
            if (Date.now() - lockData.timestamp < 10 * 60 * 1000) {
                throw new Error(`Indexing lock active for project ${repoId} (Job ID: ${lockData.jobId})`);
            }
        }

        const lockInfo = { jobId: `job_${Date.now()}`, timestamp: Date.now() };
        fs.writeFileSync(lockFile, JSON.stringify(lockInfo), 'utf8');
        return lockInfo.jobId;
    }

    static releaseLock(repoId) {
        const lockFile = this.getLockFilePath(repoId);
        if (fs.existsSync(lockFile)) {
            try {
                fs.unlinkSync(lockFile);
            } catch (err) {
                // Ignore unlink errors
            }
        }
    }
}

module.exports = ProjectLocker;
