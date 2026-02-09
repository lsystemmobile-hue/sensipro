import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { getVideos, Video, logVideoAccess, getSignedVideoUrl } from '@/lib/video';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gamepad2, LogOut, Play, ArrowLeft, Lock, Clock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import VideoPlayer from '@/components/VideoPlayer';

export default function DashboardPage() {
  const { user, logout, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedVideoToken, setSelectedVideoToken] = useState<string | null>(null);
  const [selectedVideoUsername, setSelectedVideoUsername] = useState<string | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    async function loadVideos() {
      try {
        const data = await getVideos();
        setVideos(data);
      } catch (err) {
        console.error('Failed to load videos', err);
      } finally {
        setLoading(false);
      }
    }
    loadVideos();
  }, []);

  // Auto-refresh token every 10 minutes if video is playing
  useEffect(() => {
    if (!selectedVideo || !isPlaying) return;

    const interval = setInterval(async () => {
      console.log('Refreshing video token...');
      try {
        const result = await getSignedVideoUrl(selectedVideo.storage_path);
        if (result) {
          setSelectedVideoUrl(result.url);
          setSelectedVideoToken(result.token);
        }
      } catch (err) {
        console.error('Failed to refresh token:', err);
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [selectedVideo, isPlaying]);

  if (authLoading || (loading && videos.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const hasAccess = user.subscriptionStatus === 'active';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleVideoSelect = async (video: Video) => {
    setSelectedVideo(video);
    setIsUrlLoading(true);
    logVideoAccess(user.id, video.id, 'view');

    try {
      const result = await getSignedVideoUrl(video.storage_path);
      if (result) {
        setSelectedVideoUrl(result.url);
        setSelectedVideoToken(result.token);
        setSelectedVideoUsername(result.username);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Failed to get signed URL', err);
    } finally {
      setIsUrlLoading(false);
    }
  };

  if (selectedVideo && hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container flex items-center justify-between h-14 px-4">
            <button
              onClick={() => {
                setSelectedVideo(null);
                setSelectedVideoUrl(null);
                setSelectedVideoToken(null);
                setSelectedVideoUsername(null);
                setIsPlaying(false);
              }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <span className="font-display text-sm font-semibold text-primary truncate mx-2">{selectedVideo.title}</span>
            <div className="w-16" />
          </div>
        </header>
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="rounded-xl overflow-hidden border border-border bg-secondary shadow-lg min-h-[300px] flex items-center justify-center">
            {isUrlLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : selectedVideoUrl ? (
              <VideoPlayer
                src={selectedVideoUrl}
                title={selectedVideo.title}
                thumbnail={selectedVideo.thumbnail_url || undefined}
              />
            ) : (
              <div className="text-destructive flex flex-col items-center gap-2">
                <Lock className="h-8 w-8" />
                <span>Erro ao carregar vídeo. Tente novamente.</span>
              </div>
            )}
          </div>
          <h2 className="font-display text-xl font-bold mt-4">{selectedVideo.title}</h2>
          <p className="text-muted-foreground mt-1">{selectedVideo.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="h-6 w-6" />
            <span className="font-display text-sm font-bold text-primary">SENSI <span className="text-foreground">PRO</span></span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="text-xs">
                Admin
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">Olá, {user.username}! 👋</h1>
          {hasAccess ? (
            <p className="text-sm text-muted-foreground mt-1">
              Acesso ativo até {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString('pt-BR') : 'Indeterminado'}
            </p>
          ) : (
            <div className="flex items-center gap-2 mt-2 text-destructive bg-destructive/10 rounded-md p-3 text-sm">
              <Lock className="h-4 w-4" />
              Seu acesso expirou. Contate o administrador para renovar.
            </div>
          )}
        </div>

        {!hasAccess ? (
          <div className="text-center py-16">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-muted-foreground">Conteúdo Bloqueado</h2>
            <p className="text-sm text-muted-foreground mt-2">Renove seu acesso para continuar assistindo.</p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-lg font-semibold mb-4">Sua Biblioteca</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videos.map((video, i) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="bg-card border-border hover:border-primary/40 transition-all cursor-pointer group overflow-hidden"
                    onClick={() => handleVideoSelect(video)}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      {video.thumbnail_url || '/capa.jpg' ? (
                        <img
                          src={video.thumbnail_url || '/capa.jpg'}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <Play className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-3 rounded-full bg-primary">
                          <Play className="h-6 w-6 text-primary-foreground" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 text-xs bg-background/80 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                      </span>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-display text-sm font-semibold truncate">{video.title}</h3>
                      {video.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{video.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
