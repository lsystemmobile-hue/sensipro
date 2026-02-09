import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import {
    getAllUserProfiles,
    updateUserProfile,
    deleteUserProfile,
    createUserAccount,
    createVideo,
    updateVideo,
    deleteVideo,
    UserProfile,
    Video
} from '@/lib/admin';
import { getVideos } from '@/lib/video';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Gamepad2,
    ArrowLeft,
    Plus,
    Trash2,
    RefreshCw,
    Pencil,
    Users,
    Wifi,
    Video as VideoIcon,
    Play,
    Clock,
    FileVideo,
    Loader2,
    ShieldOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Loading state
    const [loading, setLoading] = useState(true);

    // Users logic
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [userFormOpen, setUserFormOpen] = useState(false);
    const [editUser, setEditUser] = useState<UserProfile | null>(null);
    const [formUsername, setFormUsername] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formExpires, setFormExpires] = useState('');

    // Videos logic
    const [videos, setVideos] = useState<Video[]>([]);
    const [videoDialogOpen, setVideoDialogOpen] = useState(false);
    const [editVideo, setEditVideo] = useState<Video | null>(null);
    const [vTitle, setVTitle] = useState('');
    const [vDesc, setVDesc] = useState('');
    const [vThumb, setVThumb] = useState('');
    const [vUrl, setVUrl] = useState('');
    const [vDuration, setVDuration] = useState('');
    const [vOrder, setVOrder] = useState('1');

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        setLoading(true);
        try {
            const [uData, vData] = await Promise.all([
                getAllUserProfiles(),
                getVideos()
            ]);
            setUsers(uData);
            setVideos(vData);
        } catch (err) {
            toast({ title: 'Erro ao carregar dados.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    if (!user || !isAdmin) return <Navigate to="/dashboard" />;

    // User Handlers
    const openCreateUser = () => {
        setEditUser(null);
        setFormUsername('');
        setFormPassword('');
        const defaultExpires = new Date();
        defaultExpires.setDate(defaultExpires.getDate() + 30);
        setFormExpires(defaultExpires.toISOString().split('T')[0]);
        setUserFormOpen(true);
    };

    const openEditUser = (u: UserProfile) => {
        setEditUser(u);
        setFormUsername(u.username);
        setFormPassword(''); // Don't show/edit password here for security/simplicity
        setFormExpires(u.subscription_expires_at?.split('T')[0] || '');
        setUserFormOpen(true);
    };

    const handleSaveUser = async () => {
        if (!formUsername || (!editUser && !formPassword) || !formExpires) {
            toast({ title: 'Preencha todos os campos.', variant: 'destructive' });
            return;
        }

        try {
            const expiresDate = new Date(formExpires).toISOString();

            if (editUser) {
                // Update
                await updateUserProfile(editUser.id, {
                    username: formUsername,
                    subscription_expires_at: expiresDate
                });
                toast({ title: 'Usuário atualizado!' });
            } else {
                // Create
                await createUserAccount(formUsername, formPassword, expiresDate);
                toast({ title: 'Usuário criado com sucesso!' });
            }

            setUserFormOpen(false);
            refreshData();
        } catch (err: any) {
            toast({
                title: editUser ? 'Erro ao salvar usuário' : 'Erro ao criar usuário',
                description: err.message,
                variant: 'destructive'
            });
        }
    };

    const toggleUserStatus = async (u: UserProfile) => {
        const newStatus = u.subscription_status === 'active' ? 'expired' : 'active';
        try {
            await updateUserProfile(u.id, { subscription_status: newStatus });
            toast({ title: `Status alterado para ${newStatus}!` });
            refreshData();
        } catch (err: any) {
            toast({ title: 'Erro ao alterar status.', variant: 'destructive' });
        }
    };

    // Video Handlers
    const openCreateVideo = () => {
        setEditVideo(null);
        setVTitle('');
        setVDesc('');
        setVThumb('');
        setVUrl('');
        setVDuration('0');
        setVOrder((videos.length + 1).toString());
        setVideoDialogOpen(true);
    };

    const openEditVideo = (v: Video) => {
        setEditVideo(v);
        setVTitle(v.title);
        setVDesc(v.description || '');
        setVThumb(v.thumbnail_url || '');
        setVUrl(v.storage_path);
        setVDuration(v.duration?.toString() || '0');
        setVOrder(v.order.toString());
        setVideoDialogOpen(true);
    };

    const handleSaveVideo = async () => {
        if (!vTitle || !vUrl) {
            toast({ title: 'Título e URL são obrigatórios.', variant: 'destructive' });
            return;
        }
        const data = {
            title: vTitle,
            description: vDesc,
            thumbnail_url: vThumb,
            storage_path: vUrl,
            duration: parseInt(vDuration) || 0,
            order: parseInt(vOrder) || 0,
            category: 'Tutorial', // Default category
            is_active: true
        };

        try {
            if (editVideo) {
                await updateVideo(editVideo.id, data);
                toast({ title: 'Vídeo atualizado!' });
            } else {
                await createVideo(data);
                toast({ title: 'Vídeo criado!' });
            }
            setVideoDialogOpen(false);
            refreshData();
        } catch (err: any) {
            toast({ title: 'Erro ao salvar vídeo.', description: err.message, variant: 'destructive' });
        }
    };

    const handleDeleteVideoConfirm = async (id: string) => {
        if (window.confirm('Excluir este vídeo permanentemente?')) {
            try {
                await deleteVideo(id);
                toast({ title: 'Vídeo removido.' });
                refreshData();
            } catch (err: any) {
                toast({ title: 'Erro ao remover vídeo.', variant: 'destructive' });
            }
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="container flex items-center justify-between h-14 px-4">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Dashboard
                    </button>
                    <div className="flex items-center gap-2">
                        <img src="/logo.svg" alt="Logo" className="h-5 w-5" />
                        <span className="font-display text-sm font-bold">ADMIN</span>
                    </div>
                    <div className="w-20" />
                </div>
            </header>

            <div className="container max-w-4xl mx-auto px-4 py-6">
                <Tabs defaultValue="users" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                        <TabsTrigger value="users" className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> Usuários
                        </TabsTrigger>
                        <TabsTrigger value="videos" className="flex items-center gap-2">
                            <VideoIcon className="h-4 w-4" /> Vídeos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                <h1 className="font-display text-xl font-bold">Gerenciar Usuários</h1>
                            </div>
                            <Dialog open={userFormOpen} onOpenChange={setUserFormOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" onClick={openCreateUser}>
                                        <Plus className="h-4 w-4 mr-1" /> Novo Usuário
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-border max-w-sm">
                                    <DialogHeader>
                                        <DialogTitle className="font-display text-xl">
                                            {editUser ? 'Editar Usuário' : 'Criar Novo Acesso'}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 mt-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="user-username">Usuário (Login)</Label>
                                            <Input
                                                id="user-username"
                                                value={formUsername}
                                                onChange={e => setFormUsername(e.target.value)}
                                                placeholder="Ex: joao123"
                                                className="h-11"
                                            />
                                        </div>
                                        {!editUser && (
                                            <div className="space-y-1">
                                                <Label htmlFor="user-password">Senha</Label>
                                                <Input
                                                    id="user-password"
                                                    type="password"
                                                    value={formPassword}
                                                    onChange={e => setFormPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="h-11"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-1 pt-2">
                                            <Label htmlFor="user-expires" className="text-xs">Data de Expiração</Label>
                                            <Input
                                                id="user-expires"
                                                type="date"
                                                value={formExpires}
                                                onChange={e => setFormExpires(e.target.value)}
                                                className="h-11"
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <Button className="w-full font-display font-bold h-12 text-lg" onClick={handleSaveUser}>
                                                {editUser ? 'SALVAR ALTERAÇÕES' : 'CRIAR ACESSO'}
                                            </Button>
                                        </div>

                                        <p className="text-[10px] text-muted-foreground italic text-center leading-relaxed">
                                            {editUser
                                                ? 'As alterações serão aplicadas imediatamente ao perfil do cliente.'
                                                : 'O cliente usará o Usuário e a Senha definidos acima para acessar a plataforma.'
                                            }
                                        </p>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {loading && users.length === 0 ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
                        ) : (
                            <div className="space-y-3">
                                {users.map(u => (
                                    <Card key={u.id} className="bg-card border-border">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-display font-semibold text-sm">{u.username}</span>
                                                        <Badge variant={u.subscription_status === 'active' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                                                            {u.subscription_status}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground">{u.email}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Expira: {u.subscription_expires_at ? new Date(u.subscription_expires_at).toLocaleDateString('pt-BR') : 'Sem data'}
                                                    </p>
                                                    {u.allowed_ip && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/20 bg-primary/5">
                                                                IP: {u.allowed_ip}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {u.allowed_ip && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-orange-500 hover:text-orange-600"
                                                            onClick={async () => {
                                                                if (window.confirm('Resetar trava de IP deste usuário?')) {
                                                                    try {
                                                                        await updateUserProfile(u.id, { allowed_ip: null });
                                                                        refreshData();
                                                                        toast({ title: 'Trava de IP resetada!' });
                                                                    } catch (err: any) {
                                                                        toast({
                                                                            title: 'Erro ao resetar IP',
                                                                            description: err.message,
                                                                            variant: 'destructive'
                                                                        });
                                                                    }
                                                                }
                                                            }}
                                                            title="Resetar IP"
                                                        >
                                                            <ShieldOff className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditUser(u)} title="Editar">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-8 w-8 ${u.subscription_status === 'active' ? 'text-destructive' : 'text-primary'}`}
                                                        onClick={() => toggleUserStatus(u)}
                                                        title={u.subscription_status === 'active' ? 'Desativar' : 'Ativar'}
                                                    >
                                                        <RefreshCw className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={async () => {
                                                        if (window.confirm('Excluir perfil?')) {
                                                            await deleteUserProfile(u.id);
                                                            refreshData();
                                                        }
                                                    }} title="Excluir">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="videos">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <VideoIcon className="h-5 w-5 text-primary" />
                                <h1 className="font-display text-xl font-bold">Gerenciar Vídeos</h1>
                            </div>
                            <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" onClick={openCreateVideo}>
                                        <Plus className="h-4 w-4 mr-1" /> Novo Vídeo
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-border max-w-sm">
                                    <DialogHeader>
                                        <DialogTitle className="font-display">{editVideo ? 'Editar Vídeo' : 'Novo Vídeo'}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto px-1">
                                        <div className="space-y-1">
                                            <Label>Título</Label>
                                            <Input value={vTitle} onChange={e => setVTitle(e.target.value)} placeholder="Ex: Tutorial de HUD" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Descrição</Label>
                                            <Input value={vDesc} onChange={e => setVDesc(e.target.value)} placeholder="Breve descrição..." />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Caminho no R2 / URL</Label>
                                            <div className="space-y-2">
                                                <Input value={vUrl} onChange={e => setVUrl(e.target.value)} placeholder="Ex: videos-dashboard/nome.mp4" />
                                                <div className="text-[10px] text-muted-foreground bg-accent/30 p-2 rounded leading-relaxed">
                                                    Dica: Digite o caminho relativo no bucket (ex: `videos-dashboard/video.mp4`) ou uma URL completa.
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Thumbnail (URL)</Label>
                                            <Input value={vThumb} onChange={e => setVThumb(e.target.value)} placeholder="https://..." />
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="space-y-1 flex-1">
                                                <Label>Duração (s)</Label>
                                                <Input type="number" value={vDuration} onChange={e => setVDuration(e.target.value)} placeholder="Segundos" />
                                            </div>
                                            <div className="space-y-1 flex-1">
                                                <Label>Ordem</Label>
                                                <Input type="number" value={vOrder} onChange={e => setVOrder(e.target.value)} />
                                            </div>
                                        </div>
                                        <Button className="w-full font-display" onClick={handleSaveVideo}>Salvar Vídeo</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {videos.map(v => (
                                <Card key={v.id} className="bg-card border-border overflow-hidden">
                                    <div className="aspect-video relative group">
                                        {v.thumbnail_url ? (
                                            <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-secondary flex items-center justify-center">
                                                <Play className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button variant="secondary" size="icon" onClick={() => openEditVideo(v)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="destructive" size="icon" onClick={() => handleDeleteVideoConfirm(v.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="absolute top-2 left-2">
                                            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">#{v.order}</Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-3">
                                        <h3 className="font-display font-semibold text-sm truncate">{v.title}</h3>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {v.duration}s
                                            </span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 max-w-[150px] truncate">
                                                <FileVideo className="h-3 w-3" /> {v.storage_path}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {videos.length === 0 && (
                                <div className="col-span-full text-center py-16 text-muted-foreground">
                                    <Play className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhum vídeo cadastrado.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
