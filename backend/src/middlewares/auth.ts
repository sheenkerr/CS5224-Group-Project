import { clerkMiddleware, getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";

export const clerkAuth = clerkMiddleware();

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Attach userId to request so routes can use it
  (req as any).userId = userId;
  next();
}