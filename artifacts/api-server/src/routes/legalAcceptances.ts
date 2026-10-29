import { and, eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, legalAcceptanceTable } from "@workspace/db";
import {
  RecordLegalAcceptanceResponse,
  RecordLegalAcceptanceBody,
} from "@workspace/api-zod";
import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

function getAuthenticatedUserId(req: Request, res: Response): string | null {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return userId;
}

router.post("/legal-acceptances", async (req, res): Promise<void> => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const parsed = RecordLegalAcceptanceBody.safeParse(req.body);
  if (!parsed.success || parsed.data.adultAttested !== true) {
    res.status(400).json({ error: "Adult confirmation is required" });
    return;
  }

  const values = {
    userId,
    termsVersion: parsed.data.termsVersion,
    privacyVersion: parsed.data.privacyVersion,
    adultAttested: true,
  };
  const [created] = await db
    .insert(legalAcceptanceTable)
    .values(values)
    .onConflictDoNothing()
    .returning();
  const [acceptance] = created
    ? [created]
    : await db
        .select()
        .from(legalAcceptanceTable)
        .where(
          and(
            eq(legalAcceptanceTable.userId, userId),
            eq(legalAcceptanceTable.termsVersion, parsed.data.termsVersion),
            eq(legalAcceptanceTable.privacyVersion, parsed.data.privacyVersion),
          ),
        )
        .limit(1);

  if (!acceptance) {
    res.status(500).json({ error: "Could not record legal acceptance" });
    return;
  }

  res.status(created ? 201 : 200).json(
    RecordLegalAcceptanceResponse.parse({
      termsVersion: acceptance.termsVersion,
      privacyVersion: acceptance.privacyVersion,
      adultAttested: acceptance.adultAttested,
      acceptedAt: acceptance.acceptedAt.toISOString(),
    }),
  );
});

export default router;
