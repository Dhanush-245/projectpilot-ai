import { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK safely
// In Google Cloud Run / GCP environments, Application Default Credentials (ADC) are automatically picked up.
let firebaseAdminApp: App | null = null;

export function getFirebaseAdmin(): App {
  if (!firebaseAdminApp) {
    const apps = getApps();
    if (apps.length > 0 && apps[0]) {
      firebaseAdminApp = apps[0];
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0616895579';
      firebaseAdminApp = initializeApp({
        projectId
      });
    }
  }
  return firebaseAdminApp;
}

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

/**
 * Authentication Middleware:
 * Extracts and verifies the Firebase ID token from `Authorization: Bearer <token>`
 * Returns HTTP 401 for missing, malformed, expired, or invalid tokens without exposing internals.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or malformed Authorization header. Bearer token required.'
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Empty authorization token provided.'
    });
  }

  try {
    const adminApp = getFirebaseAdmin();
    const authService = getAuth(adminApp);
    const decodedToken = await authService.verifyIdToken(token);
    
    if (!decodedToken || !decodedToken.uid) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid token claims.'
      });
    }

    req.user = decodedToken;
    next();
  } catch (err: any) {
    // Log server-side warning safely without exposing token or secrets
    console.warn(`[AuthMiddleware] Token verification failed: ${err?.code || 'auth/invalid-token'}`);
    
    return res.status(401).json({
      error: 'Unauthorized: Token verification failed or token has expired.'
    });
  }
}

/**
 * In-memory lightweight rate limiter for Cloud Run / stateless Node.js.
 * Limits requests per IP/UID window to prevent resource exhaustion and abuse.
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale rate limit entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(options: { windowMs: number; maxRequests: number }) {
  const { windowMs, maxRequests } = options;

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const identifier = req.user?.uid || req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = rateLimitMap.get(identifier);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        error: 'Too many requests. Please slow down and try again later.',
        retryAfterSeconds: retryAfterSec
      });
    }

    record.count += 1;
    next();
  };
}

/**
 * Defensive string sanitizer to truncate excessive user payload strings
 */
export function sanitizeString(val: any, maxLength: number = 2000): string {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  return trimmed.length > maxLength ? trimmed.substring(0, maxLength) : trimmed;
}
