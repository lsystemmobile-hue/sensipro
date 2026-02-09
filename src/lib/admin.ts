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
        // 1. Create Auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Falha ao criar usuário de autenticação');

        // 2. Create user profile
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                username,
                subscription_status: 'active',
                subscription_expires_at: expiresAt,
            });

        if (profileError) throw profileError;

        return { success: true, userId: authData.user.id };
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao criar usuário');
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
