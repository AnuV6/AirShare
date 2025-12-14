import { NextRequest, NextResponse } from 'next/server';
import { UPLOAD_DIR, CHUNK_DIR } from '@/lib/constants';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { fileName, uploadId, totalChunks } = body;

        if (!fileName || !uploadId || totalChunks === undefined) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const currentChunkDir = path.join(CHUNK_DIR, uploadId);
        const finalFilePath = path.join(UPLOAD_DIR, fileName);

        // Ensure upload dir exists
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }

        const tempFilePath = finalFilePath + '.tmp';

        // Create/Clear the temp file first
        fs.writeFileSync(tempFilePath, '');

        // Append chunks sequentially using synchronous operations for maximum stability/safety on Windows
        for (let i = 0; i < totalChunks; i++) {
            const chunkPath = path.join(currentChunkDir, i.toString());

            if (!fs.existsSync(chunkPath)) {
                try { fs.unlinkSync(tempFilePath); } catch (e) { }
                throw new Error(`Missing chunk ${i}`);
            }

            const data = fs.readFileSync(chunkPath);
            fs.appendFileSync(tempFilePath, data);
        }

        // Verify size if provided
        if (body.fileSize) {
            const stats = fs.statSync(tempFilePath);
            if (stats.size !== body.fileSize) {
                // Determine if we should delete the corrupt file? Yes.
                try { fs.unlinkSync(tempFilePath); } catch (e) { }
                throw new Error(`Size mismatch: expected ${body.fileSize}, got ${stats.size}`);
            }
        }

        // Atomic rename: This ensures the file is only visible when 100% complete and verified
        // On Windows, renameSync might fail if dest exists, so unlink dest first if needed? 
        // fs.renameSync overwrites on POSIX, but Windows can be tricky. Let's try direct rename, if fail, unlink then rename.
        try {
            fs.renameSync(tempFilePath, finalFilePath);
        } catch (renameError) {
            if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
            fs.renameSync(tempFilePath, finalFilePath);
        }

        // Cleanup chunks
        fs.rmSync(currentChunkDir, { recursive: true, force: true });

        return NextResponse.json({ success: true, filePath: finalFilePath });
    } catch (error) {
        console.error('Error completing upload:', error);
        return NextResponse.json({ error: 'Merge failed' }, { status: 500 });
    }
}
