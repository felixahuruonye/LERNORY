import type { RequestHandler, Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Prioritize VITE_SUPABASE_URL since it's confirmed working for frontend
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('Supabase Auth Config:', { 
  hasUrl: !!supabaseUrl, 
  urlPrefix: supabaseUrl?.substring(0, 30),
  hasServiceKey: !!supabaseServiceKey 
});

if (!supabaseUrl) {
  console.error('CRITICAL: SUPABASE_URL not set - authentication will not work');
}
if (!supabaseServiceKey) {
  console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY not set - authentication will not work');
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const supabaseAuth: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!supabase) {
      console.error('Supabase not configured - missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ message: 'Server authentication not configured' });
    }

    // Log token info for debugging (first 20 chars only)
    console.log('Auth attempt with token prefix:', token.substring(0, 20) + '...');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Supabase auth error:', {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      return res.status(401).json({ message: 'Unauthorized - Invalid token', error: error.message });
    }
    
    if (!user) {
      console.error('Supabase getUser returned no user');
      return res.status(401).json({ message: 'Unauthorized - No user found' });
    }
    
    console.log('Auth success for user:', user.email);

    req.userId = user.id;
    req.userEmail = user.email;
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export const optionalSupabaseAuth: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || !supabase) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);

    if (user) {
      req.userId = user.id;
      req.userEmail = user.email;
    }
    
    next();
  } catch {
    next();
  }
};
