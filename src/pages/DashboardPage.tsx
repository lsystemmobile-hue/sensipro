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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(234,179,8,0.05),transparent_50%)] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-7xl flex items-center justify-between h-16 px-4 mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <img src="/logo.svg" alt="Logo" className="h-5 w-5" />
            </div>
            <span className="font-display text-base font-black tracking-tighter">
              <span className="text-primary italic">SENSI</span> PRO
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="h-9 px-4 text-xs font-bold tracking-widest border-primary/20 hover:bg-primary/10 hover:text-primary transition-all hidden sm:flex"
              >
                PAINEL ADMIN
              </Button>
            )}
            <div className="h-8 w-[1px] bg-border/50 mx-1 hidden sm:block" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8 relative">
        <AnimatePresence mode="wait">
          {selectedVideo && hasAccess ? (
            <motion.div
              key="player"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={closePlayer}
                  className="group flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground hover:text-foreground transition-colors uppercase"
                >
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Voltar para Biblioteca
                </button>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <Play className="h-3 w-3 text-primary animate-pulse" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Assistindo Agora</span>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-border/50 bg-black shadow-2xl box-glow-yellow relative group">
                {isUrlLoading ? (
                  <div className="aspect-video flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-xs font-display tracking-widest text-muted-foreground uppercase">Descriptografando...</p>
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
                      <p className="font-display font-bold text-lg mb-1">ERRO DE ACESSO</p>
                      <p className="text-sm text-muted-foreground max-w-xs px-4">Não foi possível carregar a stream. Tente selecionar o vídeo novamente.</p>
                      <Button variant="outline" size="sm" className="mt-6" onClick={closePlayer}>RECARREGAR</Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                <div className="lg:col-span-2 space-y-4">
                  <h1 className="font-display text-2xl md:text-3xl font-black tracking-tight">{selectedVideo.title}</h1>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{selectedVideo.description}</p>
                </div>
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-4">
                    <h3 className="font-display text-xs font-bold tracking-widest uppercase text-muted-foreground border-b border-border/50 pb-3">Informações do Vídeo</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Duração</span>
                        <span className="text-xs font-bold font-display">{selectedVideo.duration ? `${Math.floor(selectedVideo.duration / 60)}:${(selectedVideo.duration % 60).toString().padStart(2, '0')}` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-2"><LayoutDashboard className="h-3.5 w-3.5" /> Categoria</span>
                        <span className="text-xs font-bold font-display text-primary uppercase">{selectedVideo.category || 'Membro'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {/* User Welcome Section */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-1 w-fit rounded-full bg-primary/10 border border-primary/20 mb-2">
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Membro Verificado</span>
                  </div>
                  <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight leading-none uppercase">
                    E aí, <span className="text-primary">{user.username}</span>!
                  </h1>
                  <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                    Prepare-se para dominar o campo de batalha.
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
                    <Calendar className="h-3 w-3" />
                    {hasAccess ? (
                      <span>Expira: {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString('pt-BR') : 'Tempo Vitalício'}</span>
                    ) : (
                      <span className="text-destructive">Acesso Expirado</span>
                    )}
                  </div>
                </div>
              </div>

              {!hasAccess ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-card/50 rounded-3xl border-2 border-dashed border-destructive/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-destructive/5 pointer-events-none" />
                  <div className="p-6 rounded-3xl bg-destructive/10 text-destructive mb-6 relative z-10">
                    <Lock className="h-16 w-16" />
                  </div>
                  <h2 className="font-display text-2xl font-black mb-3 relative z-10 uppercase">Acesso Bloqueado</h2>
                  <p className="text-muted-foreground max-w-sm mb-8 relative z-10">Sua assinatura expirou. Entre em contato com o suporte para renovar sua licença e voltar a jogar.</p>
                  <Button
                    className="font-display font-bold px-10 h-14 text-lg relative z-10 box-glow-yellow"
                    onClick={() => window.open('https://wa.me/5515998392835', '_blank')}
                  >
                    RENOVAR AGORA
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold tracking-tight border-l-4 border-primary pl-4 uppercase">Minha Biblioteca</h2>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 px-2 py-1 rounded">{videos.length} VÍDEOS</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video, i) => (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card
                          className="group relative bg-card border-border/50 hover:border-primary/50 transition-all duration-500 cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-primary/5 hover:-translate-y-2 box-glow-yellow"
                          onClick={() => handleVideoSelect(video)}
                        >
                          <div className="relative aspect-video overflow-hidden">
                            <img
                              src={video.thumbnail_url || '/capa.jpg'}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                            {/* Overlay effects */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80" />
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="p-4 rounded-full bg-primary text-black transform scale-0 group-hover:scale-100 transition-transform duration-500 shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                                <Play className="h-8 w-8 fill-current" />
                              </div>
                            </div>

                            {/* Badge and Duration */}
                            <div className="absolute top-3 left-3 flex items-center gap-2">
                              <span className="px-2 py-0.5 text-[8px] font-black bg-primary/90 text-black rounded-full uppercase tracking-widest shadow-xl">Premium</span>
                            </div>

                            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white transition-opacity group-hover:opacity-0">
                              <Clock className="h-3 w-3 text-primary" />
                              {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                            </div>
                          </div>

                          <CardContent className="p-5 space-y-2">
                            <h3 className="font-display text-sm font-black truncate group-hover:text-primary transition-colors uppercase tracking-tight">{video.title}</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded uppercase">{video.category || 'Treinamento'}</span>
                              <span className="text-[10px] font-black text-primary/50 opacity-0 group-hover:opacity-100 transition-opacity">ASSISTIR AGORA →</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {videos.length === 0 && (
                    <div className="text-center py-20 px-6 rounded-3xl bg-muted/10 border-2 border-dashed border-border">
                      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="font-display font-bold text-muted-foreground uppercase tracking-widest">Nenhum vídeo encontrado</h3>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-border/50 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(234,179,8,0.03),transparent_40%)] pointer-events-none" />
        <div className="container px-4 mx-auto space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-12 bg-border/50" />
            <img src="/logo.svg" alt="Logo" className="h-8 w-8 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer" />
            <div className="h-[1px] w-12 bg-border/50" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
              SENSI PRO ANDROID — TECNOLOGIA AVANÇADA PARA JOGADORES
            </p>
            <p className="text-[10px] text-muted-foreground/60 italic">
              © {new Date().getFullYear()} Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
