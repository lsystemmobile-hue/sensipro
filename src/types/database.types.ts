export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    username: string;
                    subscription_status: 'active' | 'expired' | 'cancelled';
                    subscription_expires_at: string | null;
                    allowed_ip: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['users']['Insert']>;
            };
            videos: {
                Row: {
                    id: string;
                    title: string;
                    description: string | null;
                    category: string;
                    storage_path: string;
                    thumbnail_url: string | null;
                    duration: number | null;
                    order: number;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['videos']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['videos']['Insert']>;
            };
            access_logs: {
                Row: {
                    id: string;
                    user_id: string;
                    video_id: string;
                    action: 'view' | 'download_attempt';
                    ip_address: string | null;
                    user_agent: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['access_logs']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['access_logs']['Insert']>;
            };
        };
    };
}
