import { NextRequest, NextResponse } from 'next/server';
import { UPLOAD_DIR, CHUNK_DIR } from '@/lib/constants';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pump = promisify(pipeline);

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const fileName = formData.get('fileName') as string;
        const chunkIndex = formData.get('chunkIndex') as string;
        const uploadId = formData.get('uploadId') as string;

        if (!file || !fileName || !chunkIndex || !uploadId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const currentChunkDir = path.join(CHUNK_DIR, uploadId);

        if (!fs.existsSync(currentChunkDir)) {
            fs.mkdirSync(currentChunkDir, { recursive: true });
        }

        const chunkPath = path.join(currentChunkDir, chunkIndex);

        // Convert Web File to Node Buffer/Stream
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        fs.writeFileSync(chunkPath, buffer);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error uploading chunk:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
