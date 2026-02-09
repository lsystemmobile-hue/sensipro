import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface VideoPlayerProps {
    src: string;
    title: string;
    thumbnail?: string;
}

export default function VideoPlayer({ src, title, thumbnail }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
    const [generatedThumbnail, setGeneratedThumbnail] = useState<string | undefined>(thumbnail);
    const { user } = useAuth();

    // Usar capa.jpg como padrão se não tiver thumbnail
    useEffect(() => {
        if (thumbnail) {
            setGeneratedThumbnail(thumbnail);
        } else {
            setGeneratedThumbnail('/capa.jpg');
        }
    }, [thumbnail]);

    // Carregar vídeo
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        video.src = src;
    }, [src]);

    // Detectar DevTools (F12)
    useEffect(() => {
        const detectDevTools = () => {
            const threshold = 160;
            const widthDiff = window.outerWidth - window.innerWidth > threshold;
            const heightDiff = window.outerHeight - window.innerHeight > threshold;
            const isOpen = widthDiff || heightDiff;

            if (isOpen !== isDevToolsOpen) {
                setIsDevToolsOpen(isOpen);
            }
        };

        const interval = setInterval(detectDevTools, 1000);
        detectDevTools(); // Executa imediatamente

        return () => clearInterval(interval);
    }, [isDevToolsOpen]);

    // Bloquear atalhos de teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Bloquear F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }

            // Bloquear Ctrl+Shift+I (DevTools)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                return false;
            }

            // Bloquear Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                return false;
            }

            // Bloquear Ctrl+U (View Source)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                return false;
            }

            // Bloquear Ctrl+S (Save)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                return false;
            }

            // Bloquear PrintScreen
            if (e.key === 'PrintScreen') {
                e.preventDefault();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Bloquear botão direito
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        return false;
    };

    // Bloquear seleção de texto
    const handleSelectStart = (e: React.SyntheticEvent) => {
        e.preventDefault();
        return false;
    };

    const username = user?.email?.split('@')[0] || user?.user_metadata?.username || 'Usuario';

    return (
        <div
            className="relative w-full h-full bg-black select-none"
            onContextMenu={handleContextMenu}
            onSelectStart={handleSelectStart}
            style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
            }}
        >
            <video
                ref={videoRef}
                className="w-full h-full"
                controls
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                disableRemotePlayback
                playsInline
                poster={generatedThumbnail}
                onContextMenu={handleContextMenu}
                style={{
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                }}
            />

            {/* Watermark com username */}
            <div
                className="absolute bottom-20 right-4 px-3 py-1 bg-black/40 text-white/60 text-xs font-mono rounded pointer-events-none select-none"
                style={{
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    textShadow: '0 0 4px rgba(0,0,0,0.9)',
                }}
            >
                {username}
            </div>

            {/* Overlay invisível para prevenir interações diretas */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'transparent',
                    userSelect: 'none'
                }}
            />
        </div>
    );
}
