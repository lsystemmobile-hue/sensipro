import { supabase } from './supabase';
import { Database } from '@/types/database.types';

export type Video = Database['public']['Tables']['videos']['Row'];

export const getVideos = async (): Promise<Video[]> => {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });

    if (error) {
        console.error('Error fetching videos:', error);
        return [];
    }

    return data || [];
};

export const logVideoAccess = async (userId: string, videoId: string, action: 'view' | 'download_attempt') => {
    const { error } = await supabase
        .from('access_logs')
        .insert({
            user_id: userId,
            video_id: videoId,
            action,
        });

    if (error) {
        console.error('Error logging video access:', error);
    }
};

// Retorna URL pública direta do R2 (SEM proteções)
export const getSignedVideoUrl = async (videoPath: string): Promise<{ url: string; token: string; username: string } | null> => {
    const R2_PUBLIC_DOMAIN = 'pub-f101b1b931b6437482be3982c93b6e21.r2.dev';
    const publicUrl = `https://${R2_PUBLIC_DOMAIN}/${videoPath}`;

    return {
        url: publicUrl,
        token: '',
        username: '',
    };
};
