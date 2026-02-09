import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SignJWT } from 'https://deno.land/x/jose@v5.9.6/index.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// JWT Secret - deve ser o mesmo configurado no frontend
const JWT_SECRET = 'a8f5e2b9c4d7e1a3f6b8c2d5e9a7b4c1f3e6a9b2c5d8e1a4b7c0d3e6f9a2b5c8'
const TOKEN_EXPIRY = '900s' // 15 minutos

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get authorization header
        const authHeader = req.headers.get('authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }

        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        // Get authenticated user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            throw new Error('User not authenticated')
        }

        // Get user profile with subscription status
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('username, subscription_status, subscription_expires_at')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            throw new Error('User profile not found')
        }

        // Check if subscription is active
        if (profile.subscription_status !== 'active') {
            throw new Error('Subscription is not active')
        }

        // Check if subscription hasn't expired
        if (profile.subscription_expires_at) {
            const expiresAt = new Date(profile.subscription_expires_at)
            if (expiresAt < new Date()) {
                throw new Error('Subscription has expired')
            }
        }

        // Get video info from request body
        const body = await req.json().catch(() => ({}))
        const videoPath = body.videoPath || body.name
        const videoId = body.videoId

        if (!videoPath) {
            throw new Error('Video path is required')
        }

        // Generate JWT token
        const secret = new TextEncoder().encode(JWT_SECRET)
        const token = await new SignJWT({
            videoId: videoId || videoPath,
            userId: user.id,
            videoPath: videoPath,
            username: profile.username,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(TOKEN_EXPIRY)
            .setIssuer('sensi-pro')
            .setAudience('video-access')
            .sign(secret)

        // For now, return the R2 URL with token as query param
        // In production, this would point to a Cloudflare Worker that validates the token
        const R2_DOMAIN = "pub-f101b1b931b6437482be3982c93b6e21.r2.dev"
        const signedUrl = `https://${R2_DOMAIN}/${videoPath}?token=${token}`

        return new Response(JSON.stringify({
            signedUrl,
            token,
            expiresIn: 900, // seconds
            username: profile.username
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Error:', error)
        return new Response(JSON.stringify({
            error: error.message || 'Internal server error'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: error.message?.includes('not authenticated') ? 401 :
                error.message?.includes('not active') || error.message?.includes('expired') ? 403 : 500,
        })
    }
})
