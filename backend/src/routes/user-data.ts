import { Router, Request, Response } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { getDb } from "../utils/database";

interface AuthRequest extends Request {
  auth?: { userId: string };
}

const router = Router();

router.get("/activities", requireAuth(), async (req: AuthRequest, res: Response) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const db = getDb();
    const activities = await db.collection("activities")
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    res.json(activities);
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/notifications", requireAuth(), async (req: AuthRequest, res: Response) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const db = getDb();
    const notifications = await db.collection("notifications")
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    res.json(notifications);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
