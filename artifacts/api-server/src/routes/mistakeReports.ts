import { Router, type IRouter } from "express";
import { rateLimit } from "express-rate-limit";
import { SubmitMistakeReportBody, SubmitMistakeReportResponse } from "@workspace/api-zod";
import { db, mistakeReportTable } from "@workspace/db";

const router: IRouter = Router();
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

router.post("/mistake-reports", limiter, async (req, res): Promise<void> => {
  const parsed = SubmitMistakeReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Provide a supported language, issue type, game, and a short description of the content issue.",
    });
    return;
  }

  try {
    const [report] = await db
      .insert(mistakeReportTable)
      .values({
        ...parsed.data,
        suggestedCorrection: parsed.data.suggestedCorrection ?? "",
      })
      .returning({ createdAt: mistakeReportTable.createdAt });

    if (!report) {
      res.status(500).json({ error: "Could not save the report." });
      return;
    }

    req.log.info({
      language: parsed.data.language,
      issueType: parsed.data.issueType,
      game: parsed.data.game,
    }, "Learner content mistake report received");
    res.status(201).json(
      SubmitMistakeReportResponse.parse({ receivedAt: report.createdAt.toISOString() }),
    );
  } catch (error) {
    req.log.error({ error }, "Could not save learner content mistake report");
    res.status(500).json({ error: "Could not send your report right now. Please try again." });
  }
});

export default router;
