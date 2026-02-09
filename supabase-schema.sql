-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create access_logs table
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('view', 'download_attempt')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_videos_category ON public.videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_order ON PUBLIC.videos("order");
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_video_id ON public.access_logs(video_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for videos table  
CREATE POLICY "Anyone can view active videos" ON public.videos
  FOR SELECT USING (is_active = TRUE);

-- RLS Policies for access_logs table
CREATE POLICY "Users can insert own logs" ON public.access_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own logs" ON public.access_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Insert initial video data
INSERT INTO public.videos (title, description, category, storage_path, "order") VALUES
  ('Gráfico do Jogo', 'Tutorial sobre configuração de gráficos para melhor performance', 'Tutorial', 'videos-dashboard/grafico-jogo.mp4', 1),
  ('Sensibilidade Alta - Vídeo 2', 'Configuração de sensibilidade alta para jogadores avançados', 'Sensibilidade', 'videos-dashboard/sensibilidade-alta-2.mp4', 2),
  ('Sensibilidade Alta', 'Guia completo para configurar sensibilidade alta', 'Sensibilidade', 'videos-dashboard/sensibilidade-alta.mp4', 3),
  ('Sensibilidade Baixa', 'Como configurar sensibilidade baixa para precisão máxima', 'Sensibilidade', 'videos-dashboard/sensibilidade-baixa.mp4', 4),
  ('Sensibilidade Média', 'Configuração balanceada de sensibilidade', 'Sensibilidade', 'videos-dashboard/sensibilidade-media.mp4', 5),
  ('Tutorial MOV LEFT', 'Tutorial de movimentação lateral avançada', 'Tutorial', 'videos-dashboard/tutorial-mov-left.mp4', 6),
  ('Tutorial HUD + Emoji Rápido', 'Como configurar HUD e usar emojis rápidos', 'Tutorial', 'videos-dashboard/tutorial-hud-emoji.mp4', 7),
  ('Tutorial HUD + Movimentação', 'Guia completo de HUD e movimentação', 'Tutorial', 'videos-dashboard/tutorial-hud-movimentacao.mp4', 8);
