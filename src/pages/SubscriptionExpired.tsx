import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MessageSquare, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SubscriptionExpired() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-accent/5 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative"
            >
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Voltar para o Login
                </button>

                <Card className="bg-card border-border border-2 border-destructive/20 shadow-2xl shadow-destructive/5">
                    <CardHeader className="pb-4 text-center">
                        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-destructive animate-pulse" />
                        </div>
                        <CardTitle className="font-display text-2xl font-bold text-foreground">Acesso Expirado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 text-center">
                        <div className="space-y-2">
                            <p className="text-muted-foreground leading-relaxed">
                                Sua assinatura do <span className="text-foreground font-semibold">SENSI PRO</span> chegou ao fim ou foi desativada.
                            </p>
                            <p className="text-sm text-muted-foreground/80">
                                Para renovar seu acesso e continuar utilizando nossas ferramentas, entre em contato com o administrador.
                            </p>
                        </div>

                        <div className="pt-4 space-y-3">
                            <Button
                                onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                                className="w-full h-12 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold gap-2"
                            >
                                <MessageSquare className="w-5 h-5" />
                                RENOVAR VIA WHATSAPP
                            </Button>

                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold pt-2">
                                Suporte disponível 24/7
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
