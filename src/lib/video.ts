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

// Retorna URL para reprodução. Suporta Bunny.net, YouTube e Cloudflare Stream
export const getSignedVideoUrl = async (videoPath: string): Promise<{ url: string; token: string; username: string } | null> => {
    const cleanPath = videoPath.trim();

    // Se for uma URL completa (Bunny, YouTube, etc)
    if (cleanPath.toLowerCase().startsWith('http')) {
        return {
            url: cleanPath,
            token: '',
            username: '',
        };
    }

    // Se for apenas um ID (Cloudflare Stream ID)
    if (!cleanPath.includes('/') && cleanPath.length > 20) {
        return {
            url: `https://customer-f101b1b931b6437482be3982c93b6e21.cloudflarestream.com/${cleanPath}/manifest/video.m3u8`,
            token: '',
            username: '',
        };
    }

    return null;
};
