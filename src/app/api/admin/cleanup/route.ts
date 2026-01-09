import { NextRequest, NextResponse } from 'next/server';
import { UPLOAD_DIR, CHUNK_DIR } from '@/lib/constants';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        // Clear Uploads
        if (fs.existsSync(UPLOAD_DIR)) {
            const files = fs.readdirSync(UPLOAD_DIR);
            for (const file of files) {
                if (file === 'chunks') continue; // Skip chunks directory
                // safely remove files
                try {
                    fs.unlinkSync(path.join(UPLOAD_DIR, file));
                } catch (e) { console.error('Failed to delete file', file, e); }
            }
        }

        // Clear Chunks
        if (fs.existsSync(CHUNK_DIR)) {
            fs.rmSync(CHUNK_DIR, { recursive: true, force: true });
            // Recreate chunk dir immediately to prevent errors
            fs.mkdirSync(CHUNK_DIR, { recursive: true });
        }

        return NextResponse.json({ success: true, message: 'Storage cleared' });
    } catch (error) {
        console.error('Cleanup failed:', error);
        return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }
}
