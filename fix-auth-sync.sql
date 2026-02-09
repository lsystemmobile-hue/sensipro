-- 1. Função para carregar o perfil automaticamente quando um usuário é criado no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, subscription_status, subscription_expires_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    'active',
    NOW() + INTERVAL '30 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger que dispara a função acima
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Caso já tenha criado o usuário antes do trigger, este comando sincroniza (mude o email se necessário)
-- Substitua 'id-do-usuario' pelo ID que aparece no Auth do Supabase se quiser forçar a criação manual:
-- INSERT INTO public.users (id, email, username) 
-- VALUES ('id-do-usuario', 'admin@sensipro.com', 'Admin');
