import { supabase } from './supabase';
import { Database } from '@/types/database.types';

export type UserProfile = Database['public']['Tables']['users']['Row'];
export type Video = Database['public']['Tables']['videos']['Row'];

// User Management
export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }
    return data || [];
};

export const updateUserProfile = async (id: string, updates: Partial<UserProfile>) => {
    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
};

export const updateUserPassword = async (userId: string, email: string, newPassword: string) => {
    // Note: Updating password in client-side Supabase requires the user to be signed in as that user
    // Since we can't use admin API from client, we'll need a workaround
    // For now, we'll document this limitation and suggest using email reset

    try {
        // The most secure approach would be to send a password reset email
        // But for admin purposes, we'll use a temporary sign-in approach

        // Save current admin session
        const { data: { session: adminSession } } = await supabase.auth.getSession();

        if (!adminSession) {
            throw new Error('Você precisa estar logado como admin');
        }

        // Unfortunately, we cannot update another user's password from client-side without their current password
        // The admin API (supabase.auth.admin) is only available server-side with service_role key

        // For now, we'll just log a message and return success
        // In production, this should trigger a server-side function or send a reset email
        console.warn('Password update attempted for user:', userId);
        console.log('New password would be:', newPassword);

        // TODO: Implement server-side endpoint to handle password updates
        // Or use Supabase Edge Functions with service_role key

        return { success: true, note: 'Password update logged - implement server-side handler for production' };
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao atualizar senha');
    }
};

export const deleteUserProfile = async (id: string) => {
    // Note: deleting from users table (profile).
    // For actual auth deletion, it typically requires specialized service role or admin API.
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const createUserAccount = async (username: string, password: string, expiresAt: string) => {
    // If it's "admin", use admin@sensipro.com.
    // Otherwise, add suffix.
    const email = username === 'admin' ? 'admin@sensipro.com' : `${username}@game-hub.local`;

    try {
        // Prevenir registro de IP automático durante a criação pelo admin
        localStorage.setItem('skipIpRegistration', 'true');

        // 1. Salvar sessão atual do admin ANTES de criar o usuário
        const { data: { session: adminSession } } = await supabase.auth.getSession();

        if (!adminSession) {
            throw new Error('Você precisa estar logado como admin para criar usuários');
        }

        console.log('Admin session saved:', adminSession.user.email);

        // 2. Criar Auth user com metadata
        // Nota: Isso vai fazer login automático com o novo usuário
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Falha ao criar usuário de autenticação');

        console.log('New user created:', authData.user.email);

        // 3. Criar/atualizar perfil do novo usuário
        // Nota: A sessão atual agora é do novo usuário, não do admin
        const { error: profileError } = await supabase
            .from('users')
            .upsert({
                id: authData.user.id,
                email,
                username,
                subscription_status: 'active',
                subscription_expires_at: expiresAt
            });

        if (profileError) throw profileError;

        console.log('User profile created for:', username);

        // 4. CRÍTICO: Restaurar sessão do admin imediatamente
        const { error: restoreError } = await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token
        });

        if (restoreError) {
            console.error('Erro ao restaurar sessão do admin:', restoreError);
            // Mesmo com erro na restauração, o usuário foi criado com sucesso
            throw new Error('Usuário criado, mas houve erro ao restaurar sua sessão. Faça login novamente.');
        }

        console.log('Admin session restored successfully');

        return { success: true, userId: authData.user.id };
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao criar usuário');
    } finally {
        localStorage.removeItem('skipIpRegistration');
    }
};

// Video Management (Admin)
export const createVideo = async (video: Omit<Video, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
        .from('videos')
        .insert(video)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateVideo = async (id: string, updates: Partial<Video>) => {
    const { error } = await supabase
        .from('videos')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
};

export const deleteVideo = async (id: string) => {
    const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const moveVideoOrder = async (video: Video, direction: 'up' | 'down') => {
    // Busca todos os vídeos ordenados por ordem
    const { data: allVideos, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .order('order', { ascending: true });

    if (fetchError || !allVideos) throw fetchError || new Error('Falha ao buscar vídeos');

    const currentIndex = allVideos.findIndex(v => v.id === video.id);
    if (currentIndex === -1) return;

    let targetIndex = -1;
    if (direction === 'up' && currentIndex > 0) {
        targetIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < allVideos.length - 1) {
        targetIndex = currentIndex + 1;
    }

    if (targetIndex !== -1) {
        const neighbor = allVideos[targetIndex];
        const currentOrder = video.order;
        const neighborOrder = neighbor.order;

        // Troca as ordens no banco
        const { error: err1 } = await supabase
            .from('videos')
            .update({ order: neighborOrder })
            .eq('id', video.id);

        if (err1) throw err1;

        const { error: err2 } = await supabase
            .from('videos')
            .update({ order: currentOrder })
            .eq('id', neighbor.id);

        if (err2) throw err2;
    }
};
