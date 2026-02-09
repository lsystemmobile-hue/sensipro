import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Gamepad2, Shield, Zap, Trophy, Eye, Target, ChevronRight, Star, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const features = [
  { icon: Target, title: 'Sensibilidade Alta', desc: 'Ajustes precisos para máxima velocidade de resposta.' },
  { icon: Zap, title: 'Sensibilidade Média', desc: 'O equilíbrio perfeito entre controle e agilidade.' },
  { icon: Shield, title: 'Sensibilidade Baixa', desc: 'Foco total em precisão e controle de recoil.' },
  { icon: Trophy, title: 'HUD + Movimentação', desc: 'A melhor configuração de botões para pro-players.' },
  { icon: Star, title: 'HUD + Emoji Rápido', desc: 'Técnicas avançadas para dominar o campo.' },
  { icon: Gamepad2, title: 'Tutorial MOV LEFT', desc: 'Domine a movimentação lateral avançada.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([]);

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  React.useEffect(() => {
    if (!api) return;

    // Inicia no vídeo do centro (index 1)
    setCurrent(1);
    api.scrollTo(1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Handle video play/pause: only play the active (centered) video
  React.useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === current) {
        video.play().catch(err => console.log('Autoplay blocked:', err));
      } else {
        video.pause();
      }
    });
  }, [current]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="h-7 w-7" />
            <span className="font-display text-lg font-bold tracking-wider text-primary">SENSI <span className="text-foreground">PRO</span></span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/login')} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-screen flex items-center pt-16 px-4 overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-40"
          >
            <source src="/videos-home/jogando.mp4" type="video/mp4" />
          </video>
          {/* Overlays for contrast */}
          <div className="absolute inset-0 bg-background/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
        </div>

        <div className="container max-w-4xl mx-auto text-center relative z-10 py-12">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-6 backdrop-blur-sm">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">SENSI PRO</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-10 leading-tight">
              DOMINE O CAPA E TENHA A{' '}
              <span className="text-primary text-glow-green">SENSI PERFEITA!</span>
            </h1>
            <Button
              size="lg"
              onClick={() => scrollToSection('carousel')}
              className="text-lg px-10 py-8 font-display font-bold tracking-wider box-glow-green animate-pulse-glow"
            >
              EU QUERO A SENSI <ChevronRight className="ml-2 h-6 w-6" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Demo Videos Carousel */}
      <section id="carousel" className="py-24 bg-accent/5 overflow-hidden">
        <div className="container px-4 mx-auto mb-16">
          <div className="text-center">
            <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[0.9] md:leading-[0.85]">
              Jogando com <br />
              <span className="text-primary text-glow-green">SENSI PRO</span>
            </h2>
          </div>
        </div>

        <div className="relative group/carousel">
          <Carousel
            setApi={setApi}
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4 md:justify-center">
              {[
                { id: 'h1', title: 'Domínio de Recoil', url: '/videos-home/jogando.mp4' },
                { id: 'h2', title: 'Movimentação Avançada', url: '/videos-home/jogando2.mp4' },
                { id: 'h3', title: 'Precisão Milimétrica', url: '/videos-home/jogando3.mp4' },
              ].map((v, index) => {
                const isCenter = current === index;
                return (
                  <CarouselItem
                    key={v.id}
                    className="pl-2 md:pl-4 basis-[60%] md:basis-[35%] lg:basis-[25%]"
                    style={{
                      opacity: isCenter ? 1 : 0.5,
                      transition: 'opacity 0.3s ease',
                      zIndex: isCenter ? 10 : 0
                    }}
                  >
                    <div className="p-2">
                      <div
                        className="aspect-[9/16] rounded-2xl overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-colors duration-200 box-glow-green group/video relative shadow-xl"
                        onMouseEnter={() => {
                          // Pausa todos os vídeos
                          videoRefs.current.forEach((vid) => {
                            if (vid) vid.pause();
                          });
                          // Reproduz apenas o que tem hover
                          const video = videoRefs.current[index];
                          if (video) video.play().catch(err => console.log('Play error:', err));
                        }}
                        onMouseLeave={() => {
                          const video = videoRefs.current[index];
                          if (video) video.pause();
                          // Retoma reprodução do vídeo central
                          const centerVideo = videoRefs.current[current];
                          if (centerVideo) centerVideo.play().catch(err => console.log('Play error:', err));
                        }}
                      >
                        <video
                          ref={(el) => (videoRefs.current[index] = el)}
                          className="w-full h-full object-cover"
                          loop
                          muted
                          playsInline
                          preload="metadata"
                          onLoadedMetadata={(e) => {
                            const video = e.currentTarget;
                            video.currentTime = 0.1;
                          }}
                        >
                          <source src={v.url} type="video/mp4" />
                        </video>
                      </div>
                      <h3
                        className="text-center mt-4 font-display font-bold text-base md:text-lg tracking-tight uppercase"
                        style={{
                          color: isCenter ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.5)',
                          transition: 'color 0.3s ease'
                        }}
                      >
                        {v.title}
                      </h3>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>

        {/* CTA Button */}
        <div className="container px-4 mx-auto mt-12 text-center">
          <Button
            size="lg"
            onClick={() => scrollToSection('footer')}
            className="text-lg px-10 py-8 font-display font-bold tracking-wider box-glow-yellow animate-pulse-glow"
          >
            QUERO A SENSI PRO <ChevronRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </section>

      {/* Features & Pricing - Two Column Layout */}
      <section id="pricing" className="py-16 px-4">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left Column - Features */}
            <div>
              <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[0.9] md:leading-[0.85] mb-8 text-center">
                O que você <br />
                <span className="text-primary text-glow-yellow">recebe?</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((f, i) => (
                  <motion.div key={f.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                      <CardContent className="flex items-start gap-4 p-5">
                        <div className="p-2.5 rounded-lg bg-primary/10">
                          <f.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-foreground mb-1">{f.title}</h3>
                          <p className="text-sm text-muted-foreground">{f.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Column - Pricing Card */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <Card className="bg-card border-2 border-primary/40 box-glow-green text-center sticky top-20">
                <CardContent className="p-8">
                  <img src="/logo.svg" alt="Logo" className="h-12 w-12 mx-auto mb-4" />
                  <h2 className="text-2xl font-display font-bold mb-6">SENSI PRO</h2>
                  <div className="mb-6">
                    <span className="text-5xl font-display font-black text-primary">R$9,90</span>
                    <span className="text-muted-foreground ml-1">/mensal</span>
                  </div>
                  <ul className="text-left space-y-3 mb-8 text-sm">
                    {[
                      'Acesso a todos os conteúdos',
                      'Atualizações constantes',
                      'Suporte via WhatsApp',
                      'Acesso por 30 dias (renovável)'
                    ].map(item => (
                      <li key={item} className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="lg"
                    className="w-full font-display font-bold tracking-wider text-base sm:text-lg py-6"
                    onClick={() => window.open('https://wa.me/5515998392835?text=Quero%20adquirir%20o%20SENSI%20PRO!%20%F0%9F%94%A5', '_blank')}
                  >
                    GARANTIR MEU ACESSO
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="py-8 border-t border-border text-center text-sm text-muted-foreground px-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/logo.svg" alt="Logo" className="h-5 w-5" />
          <span className="font-display font-bold text-primary">SENSI <span className="text-foreground">PRO</span></span>
        </div>
        <p>© {new Date().getFullYear()} SENSI PRO ANDROID. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
