import { Request, Response, NextFunction } from 'express';

// Simple authentication middleware (replace with your actual auth system)
// This example assumes a basic token-based auth or session system

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // In a real app, extract user ID from auth token/session
    const userId = req.cookies.userId || req.headers.authorization?.split(' ')[1];

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
    }

    // Attach user ID to request for downstream routes
    req.user = { id: userId };
    next();
  } catch (err) {
    res.status(500).json({ error: 'Authentication failed' });
  }
}