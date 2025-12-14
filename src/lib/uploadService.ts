import { v4 as uuidv4 } from 'uuid';

export type UploadStatus = 'idle' | 'uploading' | 'paused' | 'completed' | 'error';

export interface UploadState {
    id: string;
    file: File;
    progress: number;
    status: UploadStatus;
    uploadedChunks: number;
    totalChunks: number;
    uploadId: string;
    speed: string;
}

// Detection utility
const isMobile = () => {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export class UploadTask {
    file: File;
    uploadId: string;

    // Adaptive settings
    chunkSize: number;
    concurrency: number;

    totalChunks: number;
    currentChunk: number = 0;
    completedChunks: number = 0;
    status: UploadStatus = 'idle';
    speed: string = '0 MB/s';

    onProgress: (progress: number, speed: string) => void;
    onStatusChange: (status: UploadStatus) => void;

    _cancelled: boolean = false;
    _paused: boolean = false;
    activeRequests: number = 0;

    private _lastBytesLogged: number = 0;
    private _lastTimeLogged: number = Date.now();
    private _bytesSinceLastLog: number = 0;
    private _speedInterval: NodeJS.Timeout | null = null;

    constructor(file: File, onProgress: (p: number, s: string) => void, onStatusChange: (s: UploadStatus) => void) {
        this.file = file;
        this.onProgress = onProgress;
        this.onStatusChange = onStatusChange;
        this.uploadId = uuidv4();

        // Optimize settings based on device
        if (isMobile()) {
            this.chunkSize = 5 * 1024 * 1024; // 5MB for even higher speed
            this.concurrency = 3; // Safe to parallelize now that server is fixed
        } else {
            this.chunkSize = 10 * 1024 * 1024; // 10MB for desktop
            this.concurrency = 4;
        }

        this.totalChunks = Math.ceil(file.size / this.chunkSize);
    }

    start() {
        this._paused = false;
        this._cancelled = false;
        this.status = 'uploading';
        this.onStatusChange('uploading');

        this._lastTimeLogged = Date.now();
        this._bytesSinceLastLog = 0;

        if (this._speedInterval) clearInterval(this._speedInterval);
        this._speedInterval = setInterval(() => this.calculateSpeed(), 1000);

        this.processQueue();
    }

    pause() {
        this._paused = true;
        this.status = 'paused';
        this.onStatusChange('paused');
        if (this._speedInterval) clearInterval(this._speedInterval);
        this.speed = 'Paused';
        this.onProgress(this.getProgress(), this.speed);
    }

    resume() {
        if (this.status === 'paused') {
            this._paused = false;
            this.status = 'uploading';
            this.onStatusChange('uploading');
            this._lastTimeLogged = Date.now();

            this._speedInterval = setInterval(() => this.calculateSpeed(), 1000);
            this.processQueue();
        }
    }

    cancel() {
        this._cancelled = true;
        this.status = 'idle';
        this.onStatusChange('idle');
        if (this._speedInterval) clearInterval(this._speedInterval);
    }

    private getProgress() {
        return Math.round((this.completedChunks / this.totalChunks) * 100);
    }

    private calculateSpeed() {
        if (this.status !== 'uploading') return;

        const now = Date.now();
        const timeDiff = (now - this._lastTimeLogged) / 1000; // seconds
        if (timeDiff <= 0.5) return; // Don't update too fast

        const speedBytesPerSec = this._bytesSinceLastLog / timeDiff;
        const speedMBps = (speedBytesPerSec / (1024 * 1024)).toFixed(1);

        this.speed = `${speedMBps} MB/s`;

        this._lastTimeLogged = now;
        this._bytesSinceLastLog = 0;

        this.onProgress(this.getProgress(), this.speed);
    }

    private async processQueue() {
        if (this._cancelled || this._paused) return;

        while (this.activeRequests < this.concurrency && this.currentChunk < this.totalChunks) {
            if (this._cancelled || this._paused) return;

            const chunkIndex = this.currentChunk;
            this.currentChunk++;
            this.activeRequests++;

            this.uploadChunkWrapper(chunkIndex).then(() => {
                this.activeRequests--;
                if (this.completedChunks === this.totalChunks) {
                    this.completeUpload();
                } else {
                    this.processQueue();
                }
            }).catch(err => {
                console.error("Critical upload error", err);
                this.status = 'error';
                this.onStatusChange('error');
                this._cancelled = true;
                if (this._speedInterval) clearInterval(this._speedInterval);
            });
        }
    }

    private async uploadChunkWrapper(index: number) {
        if (this._cancelled) return;
        try {
            await this.uploadChunk(index);
            this.completedChunks++;
            // Accumulate bytes for speed calculation
            const actualSize = Math.min((index + 1) * this.chunkSize, this.file.size) - (index * this.chunkSize);
            this._bytesSinceLastLog += actualSize;

            this.onProgress(this.getProgress(), this.speed);
        } catch (e) {
            throw e;
        }
    }

    private async uploadChunk(index: number) {
        const start = index * this.chunkSize;
        const end = Math.min(start + this.chunkSize, this.file.size);
        const blob = this.file.slice(start, end);

        const formData = new FormData();
        formData.append('file', blob);
        formData.append('fileName', this.file.name);
        formData.append('chunkIndex', index.toString());
        formData.append('totalChunks', this.totalChunks.toString());
        formData.append('uploadId', this.uploadId);

        const res = await fetch('/api/upload/chunk', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) throw new Error('Chunk upload failed');
    }

    private async completeUpload() {
        if (this.status === 'completed') return;

        if (this._speedInterval) clearInterval(this._speedInterval);
        this.speed = 'Done';
        this.onProgress(100, this.speed);

        const res = await fetch('/api/upload/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName: this.file.name,
                uploadId: this.uploadId,
                totalChunks: this.totalChunks,
                fileSize: this.file.size,
            }),
        });

        if (res.ok) {
            this.status = 'completed';
            this.onStatusChange('completed');
        } else {
            this.status = 'error';
            this.onStatusChange('error');
        }
    }
}
