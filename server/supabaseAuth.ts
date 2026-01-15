import type { RequestHandler, Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

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

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

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
