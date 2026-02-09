// Cloudflare Worker - Video Proxy com Validação JWT
// Este worker fica entre o frontend e o R2, validando JWT antes de servir vídeos

export default {
    async fetch(request, env) {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Authorization, Range',
            'Access-Control-Max-Age': '86400',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            const url = new URL(request.url);

            // Extrair token JWT da query string
            const token = url.searchParams.get('token');

            if (!token) {
                return new Response('No token provided', {
                    status: 401,
                    headers: corsHeaders
                });
            }

            // Validar JWT token
            const isValid = await validateJWT(token, env.JWT_SECRET);

            if (!isValid) {
                return new Response('Invalid or expired token', {
                    status: 403,
                    headers: corsHeaders
                });
            }

            // Decodificar token para pegar o videoPath
            const payload = await decodeJWT(token);
            const videoPath = payload.videoPath;

            if (!videoPath) {
                return new Response('Invalid token payload', {
                    status: 400,
                    headers: corsHeaders
                });
            }

            // Buscar vídeo do R2
            const objectKey = videoPath;

            // Processar Range header (para seek no vídeo)
            const rangeHeader = request.headers.get('range');
            let rangeOptions = {};

            if (rangeHeader) {
                // Parse "bytes=start-end" format
                const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
                if (rangeMatch) {
                    const start = parseInt(rangeMatch[1]);
                    const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : undefined;

                    if (end !== undefined) {
                        rangeOptions = {
                            range: {
                                offset: start,
                                length: end - start + 1
                            }
                        };
                    } else {
                        rangeOptions = {
                            range: {
                                offset: start
                            }
                        };
                    }
                }
            }

            const object = await env.R2_BUCKET.get(objectKey, rangeOptions);

            if (object === null) {
                return new Response('Video not found', {
                    status: 404,
                    headers: corsHeaders
                });
            }

            // Preparar headers de resposta
            const headers = new Headers(corsHeaders);
            object.writeHttpMetadata(headers);
            headers.set('etag', object.httpEtag);
            headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

            // Suportar range requests (para seek no vídeo)
            if (object.range) {
                headers.set('content-range', `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`);
            }

            // Retornar vídeo
            const status = object.body ? (request.headers.get('range') !== null ? 206 : 200) : 304;
            return new Response(object.body, {
                headers,
                status,
            });

        } catch (error) {
            console.error('Worker error:', error);
            return new Response('Internal server error: ' + error.message, {
                status: 500,
                headers: corsHeaders
            });
        }
    }
};

// Validar JWT
async function validateJWT(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;

        const payload = JSON.parse(atob(parts[1]));

        // Verificar expiração
        if (payload.exp && payload.exp < Date.now() / 1000) {
            return false;
        }

        // Verificar assinatura
        const encoder = new TextEncoder();
        const data = encoder.encode(parts[0] + '.' + parts[1]);
        const secretKey = encoder.encode(secret);

        const key = await crypto.subtle.importKey(
            'raw',
            secretKey,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const signature = base64UrlDecode(parts[2]);
        const valid = await crypto.subtle.verify(
            'HMAC',
            key,
            signature,
            data
        );

        return valid;
    } catch (error) {
        console.error('JWT validation error:', error);
        return false;
    }
}

// Decodificar JWT (sem validar)
async function decodeJWT(token) {
    try {
        const parts = token.split('.');
        return JSON.parse(atob(parts[1]));
    } catch (error) {
        return {};
    }
}

// Base64 URL decode
function base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}
