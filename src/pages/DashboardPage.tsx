import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { getVideos, Video, logVideoAccess, getSignedVideoUrl } from '@/lib/video';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Gamepad2,
  LogOut,
  Play,
  ArrowLeft,
  Lock,
  Clock,
  Loader2,
  LayoutDashboard,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from '@/components/VideoPlayer';

export default function DashboardPage() {
  const { user, logout, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
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

  if (authLoading || (loading && videos.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-display text-sm tracking-widest text-muted-foreground animate-pulse">CARREGANDO SISTEMA...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const hasAccess = user.subscriptionStatus === 'active' && (!user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) >= new Date());

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
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Failed to get signed URL', err);
    } finally {
      setIsUrlLoading(false);
    }
  };

  const closePlayer = () => {
    setSelectedVideo(null);
    setSelectedVideoUrl(null);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-7xl flex items-center justify-between h-14 px-4 mx-auto">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="h-6 w-6" />
            <span className="font-display text-sm font-bold">
              <span className="text-primary">SENSI</span> PRO
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-xs font-semibold"
              >
                ADMIN
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {selectedVideo && hasAccess ? (
            <motion.div
              key="player"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <button
                onClick={closePlayer}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>

              <div className="rounded-lg overflow-hidden border border-border bg-black">
                {isUrlLoading ? (
                  <div className="aspect-video flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Carregando...</p>
                  </div>
                ) : selectedVideoUrl ? (
                  <VideoPlayer
                    src={selectedVideoUrl}
                    title={selectedVideo.title}
                    thumbnail={selectedVideo.thumbnail_url || undefined}
                  />
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center gap-4 bg-muted/20">
                    <div className="p-4 rounded-full bg-destructive/10 text-destructive">
                      <Lock className="h-10 w-10" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-base mb-1">Erro de Acesso</p>
                      <p className="text-sm text-muted-foreground max-w-xs">Não foi possível carregar o vídeo.</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={closePlayer}>Voltar</Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold">{selectedVideo.title}</h1>
                <p className="text-muted-foreground text-sm">{selectedVideo.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedVideo.duration ? `${Math.floor(selectedVideo.duration / 60)}:${(selectedVideo.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                  </span>
                  <span>{selectedVideo.category || 'Tutorial'}</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* User Welcome */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border">
                <div className="space-y-1">
                  <h1 className="font-display text-2xl font-bold">
                    Olá, <span className="text-primary">{user.username}</span>!
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Acesse seus vídeos exclusivos.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {hasAccess ? (
                    <span>Expira: {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  ) : (
                    <span className="text-destructive">Acesso Expirado</span>
                  )}
                </div>
              </div>

              {!hasAccess ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-card rounded-lg border border-border">
                  <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-4">
                    <Lock className="h-12 w-12" />
                  </div>
                  <h2 className="font-display text-xl font-bold mb-2">Acesso Bloqueado</h2>
                  <p className="text-muted-foreground max-w-sm mb-6">Sua assinatura expirou. Entre em contato para renovar.</p>
                  <Button
                    onClick={() => window.open('https://wa.me/5515998392835', '_blank')}
                  >
                    Renovar Agora
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold">Minha Biblioteca</h2>
                    <span className="text-xs text-muted-foreground">{videos.length} vídeos</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map((video) => (
                      <Card
                        key={video.id}
                        className="group cursor-pointer overflow-hidden hover:border-primary/50 transition-all"
                        onClick={() => handleVideoSelect(video)}
                      >
                        <div className="relative aspect-video overflow-hidden bg-muted">
                          <img
                            src={video.thumbnail_url || '/capa.jpg'}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="p-3 rounded-full bg-primary text-black">
                              <Play className="h-5 w-5 fill-current" />
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-black/70 text-white text-xs">
                            <Clock className="h-3 w-3" />
                            {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{video.title}</h3>
                          {video.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{video.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {videos.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
                      <p>Nenhum vídeo encontrado</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-border text-center">
        <div className="container px-4 mx-auto space-y-3">
          <img src="/logo.svg" alt="Logo" className="h-6 w-6 mx-auto opacity-50" />
          <p className="text-xs text-muted-foreground">
            SENSI PRO ANDROID — © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
