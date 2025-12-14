import { NextRequest, NextResponse } from 'next/server';
import { UPLOAD_DIR } from '@/lib/constants';
import fs from 'fs';
import path from 'path';

// Simple mime lookup fallback
function getMimeType(filename: string) {
    const ext = path.extname(filename).toLowerCase();
    const map: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg',
        '.txt': 'text/plain',
        '.zip': 'application/zip',
        '.json': 'application/json',
    };
    return map[ext] || 'application/octet-stream';
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;
    // In Next 15 they are, but creating-next-app currently defaults to 14 or 15.
    // The type signature for params is generic. I'll await just in case or use it directly if I know.
    // Actually, let's treat it as string safely.

    if (!filename) return new NextResponse("Filename needed", { status: 400 });

    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
        return new NextResponse("File not found", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.get('range');

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const stream = fs.createReadStream(filePath, { start, end });

        // @ts-ignore: Next.js Stream Body Type compatibility
        return new NextResponse(stream, {
            status: 206,
            headers: {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize.toString(),
                'Content-Type': getMimeType(filename),
            },
        });
    } else {
        const stream = fs.createReadStream(filePath);
        // @ts-ignore
        return new NextResponse(stream, {
            status: 200,
            headers: {
                'Content-Length': fileSize.toString(),
                'Content-Type': getMimeType(filename),
            }
        })
    }
}
