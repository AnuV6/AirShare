import { NextResponse } from 'next/server';
import { UPLOAD_DIR } from '@/lib/constants';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        if (!fs.existsSync(UPLOAD_DIR)) {
            return NextResponse.json([]);
        }

        const files = fs.readdirSync(UPLOAD_DIR);
        const fileStats = files
            .filter(file => {
                // Exclude chunks directory, system files, and incomplete temp files
                if (file === 'chunks' || file === 'messages.json' || file.endsWith('.tmp')) return false;
                return fs.statSync(path.join(UPLOAD_DIR, file)).isFile();
            })
            .map(file => {
                const stats = fs.statSync(path.join(UPLOAD_DIR, file));
                return {
                    name: file,
                    size: stats.size,
                    mtime: stats.mtime
                };
            })
            .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // Newest first

        return NextResponse.json(fileStats);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { fileName } = await req.json();
        if (!fileName) return NextResponse.json({ error: 'Filename required' }, { status: 400 });

        const filePath = path.join(UPLOAD_DIR, fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
    } catch (error) {
        console.error("Delete error", error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
