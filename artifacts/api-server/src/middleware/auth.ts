import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // TODO: Replace with real Supabase JWT verification
  // const token = req.headers.authorization?.split(" ")[1];
  // const user = await supabase.auth.getUser(token);
  
  // Mock authentication for development
  const mockToken = req.headers.authorization;
  if (!mockToken && process.env.NODE_ENV !== "development") {
    res.status(401).json({ error: "Unauthorized - No token provided" });
    return;
  }

  // Inject dummy user for now
  req.user = {
    id: 1,
    email: "admin@arkooprebuild.com",
    role: "admin",
  };

  next();
  return;
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden - Insufficient permissions" });
      return;
    }
    next();
    return;
  };
}
