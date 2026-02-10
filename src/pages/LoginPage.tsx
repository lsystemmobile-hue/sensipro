import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, ArrowLeft, User, Lock, ShieldAlert, MessageCircle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // Default true
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const { loginWithUsername, isAuthenticated, loading, isIpBlocked, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  useEffect(() => {
    if (isIpBlocked) {
      setShowBlockedModal(true);
    }
  }, [isIpBlocked]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');

    const result = await loginWithUsername(username, password, rememberMe);
    if (result.success) {
      navigate('/dashboard');
    } else if (result.error?.includes('IP')) {
      // isIpBlocked state will be updated by AuthContext, triggering useEffect
    } else {
      setError(result.error || 'Erro ao fazer login.');
    }
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    setShowBlockedModal(false);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm relative">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-center gap-3">
              <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
              <CardTitle className="font-display text-xl">Acesso SENSI PRO</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Usuário"
                  className="pl-10"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="pl-10"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                  Lembrar dados
                </label>
              </div>
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>
              )}
              <Button type="submit" className="w-full font-display font-bold" disabled={loginLoading}>
                <LogIn className="mr-2 h-4 w-4" />
                {loginLoading ? 'Entrando...' : 'ENTRAR'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showBlockedModal} onOpenChange={setShowBlockedModal}>
        <DialogContent className="max-w-md bg-card border-destructive/20 shadow-2xl overflow-hidden p-0 gap-0">
          <div className="h-2 bg-destructive w-full" />
          <div className="p-6">
            <DialogHeader className="pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-destructive/10">
                  <ShieldAlert className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <DialogTitle className="font-display text-2xl font-bold text-center">Acesso Bloqueado</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Detectamos um acesso de um endereço IP diferente do registrado para sua conta.
                </p>
                <div className="bg-muted/50 p-3 rounded-md border border-border mt-4">
                  <p className="text-xs font-mono text-muted-foreground">
                    IP Registrado: <span className="text-foreground">{user?.allowedIp || 'Não identificado'}</span>
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Por motivos de segurança, sua conta foi travada neste dispositivo.
                Se você trocou de internet ou acredita que isso é um erro, entre em contato com nosso suporte para resetar sua trava de IP.
              </p>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="default"
                  className="w-full font-bold h-12 gap-2"
                  onClick={() => window.open('https://wa.me/5515998392835?text=Olá!%20Meu%20acesso%20foi%20bloqueado%20por%20IP.', '_blank')}
                >
                  <MessageCircle className="h-5 w-5" /> FALAR COM SUPORTE
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" /> VOLTAR
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground italic mt-4">
                ID da Conta: {user?.id}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
