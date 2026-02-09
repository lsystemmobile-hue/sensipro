import * as jose from 'jose';

interface VideoTokenPayload {
    videoId: string;
    userId: string;
    videoPath: string;
    username: string;
}

const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || '';
const TOKEN_EXPIRY = parseInt(import.meta.env.VITE_VIDEO_TOKEN_EXPIRY || '900'); // 15 minutes default

/**
 * Generate a JWT token for secure video access
 */
export async function generateVideoToken(payload: VideoTokenPayload): Promise<string> {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    const secret = new TextEncoder().encode(JWT_SECRET);

    const token = await new jose.SignJWT({
        videoId: payload.videoId,
        userId: payload.userId,
        videoPath: payload.videoPath,
        username: payload.username,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${TOKEN_EXPIRY}s`)
        .setIssuer('sensi-pro')
        .setAudience('video-access')
        .sign(secret);

    return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyVideoToken(token: string): Promise<VideoTokenPayload> {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    const secret = new TextEncoder().encode(JWT_SECRET);

    try {
        const { payload } = await jose.jwtVerify(token, secret, {
            issuer: 'sensi-pro',
            audience: 'video-access',
        });

        return {
            videoId: payload.videoId as string,
            userId: payload.userId as string,
            videoPath: payload.videoPath as string,
            username: payload.username as string,
        };
    } catch (error) {
        throw new Error(`Invalid or expired token: ${error}`);
    }
}

/**
 * Check if a token is about to expire (within 2 minutes)
 */
export async function isTokenExpiringSoon(token: string): Promise<boolean> {
    try {
        const payload = await verifyVideoToken(token);
        // Token validation already checks expiry, so if we get here, check manually
        const decoded = jose.decodeJwt(token);
        const exp = decoded.exp || 0;
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = exp - now;

        // Return true if less than 2 minutes remaining
        return timeLeft < 120;
    } catch {
        return true; // If verification fails, consider it expiring
    }
}
