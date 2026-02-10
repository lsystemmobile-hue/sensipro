import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle, Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
    src: string;
    title: string;
    thumbnail?: string;
}

type LoadingState = 'loading' | 'ready' | 'error' | 'buffering';

export default function VideoPlayer({ src, title, thumbnail }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    // Core States
    const [loadingState, setLoadingState] = useState<LoadingState>('loading');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // URL Logic
    const cleanSrc = src.trim();

    // Bunny.net Iframe Detection & Cleaning
    const isBunnyIframe = cleanSrc.includes('iframe.mediadelivery.net');

    const getBunnyEmbedUrl = (url: string) => {
        const match = url.match(/https:\/\/iframe\.mediadelivery\.net\/(?:play|embed)\/[a-zA-Z0-9\/-]+/);
        if (!match) return null;
        let final = match[0].replace('/play/', '/embed/');
        return `${final}${final.includes('?') ? '&' : '?'}autoplay=true`;
    };

    const bunnyEmbedUrl = isBunnyIframe ? getBunnyEmbedUrl(cleanSrc) : null;
    const isHls = cleanSrc.includes('.m3u8') || cleanSrc.includes('mediadelivery.net') && !isBunnyIframe;

    // HLS Initialization
    useEffect(() => {
        const video = videoRef.current;
        if (!video || isBunnyIframe || !cleanSrc) return;

        let hls: Hls | null = null;
        setLoadingState('loading');

        if (isHls && Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true,
                maxBufferLength: 60, // Agressive but table for mobile
                lowLatencyMode: true,
            });
            hls.loadSource(cleanSrc);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => setLoadingState('ready'));
            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) setLoadingState('error');
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            video.src = cleanSrc;
        } else {
            // Normal MP4 fallback
            video.src = cleanSrc;
        }

        const handleCanPlay = () => setLoadingState('ready');
        const handleWaiting = () => setLoadingState('buffering');
        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            setDuration(video.duration);
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            if (hls) hls.destroy();
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [cleanSrc, isBunnyIframe, isHls]);

    // UI Handlers
    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play().catch(console.error);
    }, [isPlaying]);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const time = parseFloat(e.target.value);
        videoRef.current.currentTime = time;
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            videoRef.current.muted = val === 0;
        }
        setIsMuted(val === 0);
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const triggerControls = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying) controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const watermarkText = `${user?.email?.split('@')[0] || 'Acesso Hub'} • ${new Date().toLocaleDateString()}`;

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-video bg-black select-none overflow-hidden group/player rounded-lg"
            onMouseMove={triggerControls}
            onClick={triggerControls}
            onContextMenu={e => e.preventDefault()}
        >
            {/* Player Container */}
            {isBunnyIframe && bunnyEmbedUrl ? (
                <iframe
                    src={bunnyEmbedUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                    onLoad={() => setLoadingState('ready')}
                />
            ) : (
                <video
                    ref={videoRef}
                    className="w-full h-full cursor-pointer"
                    playsInline
                    poster={thumbnail || '/capa.jpg'}
                    onClick={togglePlay}
                />
            )}

            {/* Custom UI (Only for HLS/MP4) */}
            <AnimatePresence>
                {(showControls || !isPlaying) && !isBunnyIframe && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-transparent to-black/40 flex flex-col justify-between p-4"
                    >
                        {/* Top Bar */}
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-white text-sm font-bold tracking-tight drop-shadow-lg truncate max-w-[250px] md:max-w-md">{title}</h3>
                                <div className="flex gap-2">
                                    <span className={cn(
                                        "px-2 py-0.5 text-[8px] font-black rounded-full border",
                                        isHls ? "bg-primary/20 text-primary border-primary/30" : "bg-white/10 text-white/50 border-white/10"
                                    )}>
                                        {isHls ? 'HLS STREAM' : 'STANDARD MP4'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Center Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-black pointer-events-auto shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                            >
                                {isPlaying ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-1" />}
                            </motion.button>
                        </div>

                        {/* Bottom Bar */}
                        <div className="space-y-4">
                            {/* Progress Slider */}
                            <div className="relative group/progress">
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-primary group-hover/progress:h-1.5 transition-all"
                                />
                                <div
                                    className="absolute top-0 left-0 h-full bg-primary rounded-full pointer-events-none"
                                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-white/90">
                                <div className="flex items-center gap-5">
                                    <button onClick={togglePlay} className="hover:text-primary transition-colors">
                                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    </button>

                                    <div className="flex items-center gap-2 group/vol">
                                        <button onClick={() => setIsMuted(!isMuted)} className="hover:text-primary transition-colors">
                                            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        </button>
                                        <input
                                            type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume} onChange={handleVolume}
                                            className="w-0 group-hover/vol:w-16 transition-all duration-300 h-1 accent-white"
                                        />
                                    </div>
                                    <span className="text-[10px] font-mono opacity-60">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </span>
                                </div>

                                <button onClick={toggleFullscreen} className="hover:text-primary transition-colors">
                                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading / Error States */}
            <AnimatePresence>
                {(loadingState === 'loading' || loadingState === 'buffering') && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </motion.div>
                )}
                {loadingState === 'error' && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black gap-3 text-center p-6">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                        <h4 className="text-white font-bold">Erro ao carregar o vídeo</h4>
                        <p className="text-white/40 text-xs max-w-xs">Verifique sua conexão ou a URL do vídeo no Bunny.net.</p>
                    </div>
                )}
            </AnimatePresence>

            {/* Permanent Watermark (Independent of Mode) */}
            <div className="absolute top-4 right-4 z-40 px-2 py-1 bg-black/30 backdrop-blur-md text-white/30 text-[8px] font-mono rounded-full pointer-events-none md:top-8 md:right-8">
                {watermarkText}
            </div>
        </div>
    );
}
