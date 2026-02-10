import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface VideoPlayerProps {
    src: string;
    title: string;
    thumbnail?: string;
}

type LoadingState = 'loading' | 'buffering' | 'ready' | 'error' | 'timeout';

export default function VideoPlayer({ src, title, thumbnail }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
    const [generatedThumbnail, setGeneratedThumbnail] = useState<string | undefined>(thumbnail);
    const [loadingState, setLoadingState] = useState<LoadingState>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [retryCount, setRetryCount] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { user } = useAuth();

    // Usar capa.jpg como padrão se não tiver thumbnail
    useEffect(() => {
        if (thumbnail) {
            setGeneratedThumbnail(thumbnail);
        } else {
            setGeneratedThumbnail('/capa.jpg');
        }
    }, [thumbnail]);

    // Carregar vídeo com otimizações
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        // Reset states
        setLoadingState('loading');
        setErrorMessage('');

        // Timeout de 15 segundos
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (loadingState === 'loading' || loadingState === 'buffering') {
                console.error('Video loading timeout');
                setLoadingState('timeout');
                setErrorMessage('O vídeo está demorando muito para carregar. Verifique sua conexão.');
            }
        }, 15000);

        // Event handlers
        const handleLoadStart = () => {
            console.log('Video load started');
            setLoadingState('loading');
        };

        const handleLoadedMetadata = () => {
            console.log('Video metadata loaded');
        };

        const handleLoadedData = () => {
            console.log('Video data loaded');
        };

        const handleCanPlay = () => {
            console.log('Video can play');
            setLoadingState('ready');
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };

        const handleWaiting = () => {
            console.log('Video buffering...');
            setLoadingState('buffering');
        };

        const handlePlaying = () => {
            console.log('Video playing');
            setLoadingState('ready');
        };

        const handleError = (e: Event) => {
            console.error('Video error:', e);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            const videoError = video.error;
            let message = 'Erro ao carregar o vídeo.';

            if (videoError) {
                switch (videoError.code) {
                    case MediaError.MEDIA_ERR_ABORTED:
                        message = 'Download do vídeo foi abortado.';
                        break;
                    case MediaError.MEDIA_ERR_NETWORK:
                        message = 'Erro de rede ao carregar o vídeo.';
                        break;
                    case MediaError.MEDIA_ERR_DECODE:
                        message = 'Erro ao decodificar o vídeo.';
                        break;
                    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        message = 'Formato de vídeo não suportado.';
                        break;
                }
            }

            setLoadingState('error');
            setErrorMessage(message);
        };

        const handleStalled = () => {
            console.warn('Video download stalled');
            setLoadingState('buffering');
        };

        const handleSuspend = () => {
            console.log('Video download suspended');
        };

        // Attach event listeners
        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('error', handleError);
        video.addEventListener('stalled', handleStalled);
        video.addEventListener('suspend', handleSuspend);

        // Set video source
        video.src = src;
        video.load(); // Force load

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            video.removeEventListener('loadstart', handleLoadStart);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('playing', handlePlaying);
            video.removeEventListener('error', handleError);
            video.removeEventListener('stalled', handleStalled);
            video.removeEventListener('suspend', handleSuspend);
        };
    }, [src, retryCount]);

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
        detectDevTools();

        return () => clearInterval(interval);
    }, [isDevToolsOpen]);

    // Bloquear atalhos de teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                return false;
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                return false;
            }
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                return false;
            }
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                return false;
            }
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

    // Retry handler
    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        setLoadingState('loading');
        setErrorMessage('');
    };

    const username = user?.email?.split('@')[0] || (user as any)?.user_metadata?.username || 'Usuario';

    return (
        <div
            className="relative w-full h-full bg-black select-none"
            onContextMenu={handleContextMenu}
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
                preload="metadata"
                poster={generatedThumbnail}
                onContextMenu={handleContextMenu}
                style={{
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                }}
            />

            {/* Loading Overlay */}
            {(loadingState === 'loading' || loadingState === 'buffering') && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm text-white/80">
                            {loadingState === 'loading' ? 'Carregando vídeo...' : 'Buffering...'}
                        </p>
                    </div>
                </div>
            )}

            {/* Error Overlay */}
            {(loadingState === 'error' || loadingState === 'timeout') && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4 max-w-md px-4 text-center">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {loadingState === 'timeout' ? 'Timeout' : 'Erro'}
                            </h3>
                            <p className="text-sm text-white/70">{errorMessage}</p>
                        </div>
                        <button
                            onClick={handleRetry}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Tentar novamente
                        </button>
                    </div>
                </div>
            )}

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
