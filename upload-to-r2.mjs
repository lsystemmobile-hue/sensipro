import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do R2 (compatível com S3)
const ACCOUNT_ID = 'd34b7b8b9d366c6c36a507c78444ec09';
const ACCESS_KEY_ID = '7de6fb464cb6c6a58812deaf94894eab';
const SECRET_ACCESS_KEY = 'c1c11176f95fd07af4fd89293f82a2d058c9e1b79c93f6cdeebef0cb96b4bc82';
const BUCKET_NAME = 'videos';

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
    },
});

const videos = [
    { local: 'Gráfico do Jogo.mp4', remote: 'videos-dashboard/grafico-jogo.mp4' },
    { local: 'Sensibilidade Alta [Vídeo 2].mp4', remote: 'videos-dashboard/sensibilidade-alta-2.mp4' },
    { local: 'Sensibilidade Alta.mp4', remote: 'videos-dashboard/sensibilidade-alta.mp4' },
    { local: 'Sensibilidade Baixa.mp4', remote: 'videos-dashboard/sensibilidade-baixa.mp4' },
    { local: 'Sensibilidade Média.mp4', remote: 'videos-dashboard/sensibilidade-media.mp4' },
    { local: 'Tutorial MOV LEFT.mp4', remote: 'videos-dashboard/tutorial-mov-left.mp4' },
    { local: 'Tutorial do HUD + Emoji Rápido.mp4', remote: 'videos-dashboard/tutorial-hud-emoji.mp4' },
    { local: 'Tutorial do HUD + Movimentação.mp4', remote: 'videos-dashboard/tutorial-hud-movimentacao.mp4' },
];

async function uploadVideo(localPath, remotePath) {
    const fullPath = path.join('C:\\Users\\leocl\\Desktop\\videos', localPath);

    console.log(`📤 Uploading: ${localPath}...`);

    const fileStream = fs.createReadStream(fullPath);
    const fileStats = fs.statSync(fullPath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);

    console.log(`   Size: ${fileSizeMB} MB`);

    try {
        const upload = new Upload({
            client: r2Client,
            params: {
                Bucket: BUCKET_NAME,
                Key: remotePath,
                Body: fileStream,
                ContentType: 'video/mp4',
            },
            queueSize: 4, // Concurrent parts
            partSize: 1024 * 1024 * 100, // 100MB parts
            leavePartsOnError: false,
        });

        upload.on('httpUploadProgress', (progress) => {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(2);
            process.stdout.write(`\r   Progress: ${percent}%`);
        });

        await upload.done();
        console.log(`\n✅ Uploaded: ${remotePath}\n`);
    } catch (error) {
        console.error(`\n❌ Failed: ${remotePath}`);
        console.error(`   Error: ${error.message}\n`);
        throw error;
    }
}

async function uploadAllVideos() {
    console.log('🚀 Starting upload of 8 videos to Cloudflare R2...\n');

    for (const video of videos) {
        await uploadVideo(video.local, video.remote);
    }

    console.log('🎉 All videos uploaded successfully!');
}

uploadAllVideos().catch(console.error);
