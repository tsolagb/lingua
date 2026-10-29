import { getAuth } from "@clerk/express";
import { mergeArcadeCurrency } from "../lib/arcadeProgressMerge";
import { mergeCompletionDates } from "../lib/completionDates";
import { db, learnerProgressTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";

type JsonObject = Record<string, unknown>;
const router: IRouter = Router();
const EMPTY: JsonObject = {};

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asObject(value: unknown): JsonObject {
  return isObject(value) ? value : {};
}

function mergeRecordMax(
  existing: unknown,
  incoming: unknown,
): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const source of [asObject(existing), asObject(incoming)]) {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        merged[key] = Math.max(merged[key] ?? 0, value);
      }
    }
  }
  return merged;
}

function mergeWordReviews(existing: unknown, incoming: unknown): JsonObject {
  const merged: JsonObject = { ...asObject(existing) };
  for (const [key, rawIncoming] of Object.entries(asObject(incoming))) {
    const next = asObject(rawIncoming);
    const previous = asObject(merged[key]);
    if (Object.keys(previous).length === 0) {
      merged[key] = next;
      continue;
    }

    const previousAt =
      typeof previous.lastAnsweredAt === "number" &&
      Number.isFinite(previous.lastAnsweredAt)
        ? previous.lastAnsweredAt
        : 0;
    const nextAt =
      typeof next.lastAnsweredAt === "number" &&
      Number.isFinite(next.lastAnsweredAt)
        ? next.lastAnsweredAt
        : 0;
    if (nextAt > previousAt) {
      merged[key] = next;
      continue;
    }
    if (nextAt < previousAt) continue;

    const previousGoal =
      typeof previous.requiredReviews === "number"
        ? previous.requiredReviews
        : 3;
    const nextGoal =
      typeof next.requiredReviews === "number" ? next.requiredReviews : 3;
    const goal = Math.max(previousGoal, nextGoal);
    const previousCorrect =
      typeof previous.correctReviews === "number"
        ? previous.correctReviews
        : 0;
    const nextCorrect =
      typeof next.correctReviews === "number" ? next.correctReviews : 0;
    const previousMisses =
      typeof previous.missCount === "number" ? previous.missCount : 0;
    const nextMisses = typeof next.missCount === "number" ? next.missCount : 0;
    merged[key] = {
      ...previous,
      ...next,
      requiredReviews: goal,
      correctReviews: Math.min(goal, previousCorrect, nextCorrect),
      missCount: Math.max(previousMisses, nextMisses),
    };
  }
  return merged;
}

function mergeLevelProgress(existing: unknown, incoming: unknown) {
  const merged: Record<string, Record<string, unknown>> = {};
  for (const [category, levels] of [
    Object.entries(asObject(existing)),
    Object.entries(asObject(incoming)),
  ].flat()) {
    const target = (merged[category] ??= {});
    for (const [level, rawValue] of Object.entries(asObject(levels))) {
      const value = asObject(rawValue);
      const current = asObject(target[level]);
      const stars = Math.max(
        typeof current.stars === "number" ? current.stars : 0,
        typeof value.stars === "number" ? value.stars : 0,
      );
      target[level] = {
        ...current,
        ...value,
        completed: current.completed === true || value.completed === true,
        completedAt: mergeCompletionDates(
          current.completed === true ? current.completedAt : undefined,
          value.completed === true ? value.completedAt : undefined,
        ),
        stars,
        ...(category.includes("::arcade:") ? {
          arcadeScore: Math.max(Number(current.arcadeScore) || 0, Number(value.arcadeScore) || 0),
          arcadeXp: Math.min(50, Math.max(Number(current.arcadeXp) || 0, Number(value.arcadeXp) || 0)),
          arcadeStars: Math.min(3, Math.max(Number(current.arcadeStars) || 0, Number(value.arcadeStars) || 0)),
          arcadeWon: current.arcadeWon === true || value.arcadeWon === true,
          arcadeContentId: current.arcadeContentId ?? value.arcadeContentId,
          arcadeDate: current.arcadeDate ?? value.arcadeDate,
          arcadeGrid: (Number(current.arcadeScore) || 0) >= (Number(value.arcadeScore) || 0)
            ? current.arcadeGrid ?? value.arcadeGrid : value.arcadeGrid ?? current.arcadeGrid,
        } : {}),
      };
    }
  }
  return merged;
}

function mergeSnapshots(existing: unknown, incoming: unknown): JsonObject {
  const oldSnapshot = asObject(existing);
  const newSnapshot = asObject(incoming);
  const result: JsonObject = { ...oldSnapshot, ...newSnapshot };

  result.progress = mergeLevelProgress(oldSnapshot.progress, newSnapshot.progress);
  result.wordReviews = mergeWordReviews(
    oldSnapshot.wordReviews,
    newSnapshot.wordReviews,
  );
  const sentenceReviews: JsonObject = { ...asObject(oldSnapshot.guidedSentenceReviews) };
  for (const [key, rawRecord] of Object.entries(asObject(newSnapshot.guidedSentenceReviews))) {
    const incomingRecord = asObject(rawRecord);
    const previousRecord = asObject(sentenceReviews[key]);
    const incomingAt = typeof incomingRecord.lastAnsweredAt === "number" ? incomingRecord.lastAnsweredAt : 0;
    const previousAt = typeof previousRecord.lastAnsweredAt === "number" ? previousRecord.lastAnsweredAt : 0;
    if (!(key in sentenceReviews) || incomingAt > previousAt) {
      sentenceReviews[key] = incomingRecord;
    } else if (incomingAt === previousAt) {
      sentenceReviews[key] = {
        ...previousRecord,
        correctReviews: Math.min(Number(previousRecord.correctReviews) || 0, Number(incomingRecord.correctReviews) || 0),
        requiredReviews: Math.max(Number(previousRecord.requiredReviews) || 3, Number(incomingRecord.requiredReviews) || 3),
        missCount: Math.max(Number(previousRecord.missCount) || 0, Number(incomingRecord.missCount) || 0),
      };
    }
  }
  result.guidedSentenceReviews = sentenceReviews;
  result.currency = mergeArcadeCurrency(oldSnapshot.currency, newSnapshot.currency, oldSnapshot.progress, newSnapshot.progress, result.progress);
  result.starHistory = mergeRecordMax(
    oldSnapshot.starHistory,
    newSnapshot.starHistory,
  );
  result.earnedBadgeIds = [
    ...new Set([
      ...(Array.isArray(oldSnapshot.earnedBadgeIds)
        ? oldSnapshot.earnedBadgeIds.filter(
            (id): id is string => typeof id === "string",
          )
        : []),
      ...(Array.isArray(newSnapshot.earnedBadgeIds)
        ? newSnapshot.earnedBadgeIds.filter(
            (id): id is string => typeof id === "string",
          )
        : []),
    ]),
  ];

  const oldStreak = asObject(oldSnapshot.streak);
  const newStreak = asObject(newSnapshot.streak);
  const playedDates = [
    ...new Set([
      ...(Array.isArray(oldStreak.playedDates)
        ? oldStreak.playedDates.filter(
            (date): date is string => typeof date === "string",
          )
        : []),
      ...(Array.isArray(newStreak.playedDates)
        ? newStreak.playedDates.filter(
            (date): date is string => typeof date === "string",
          )
        : []),
    ]),
  ].sort();
  const oldLast = typeof oldStreak.lastPlayedDate === "string"
    ? oldStreak.lastPlayedDate
    : "";
  const newLast = typeof newStreak.lastPlayedDate === "string"
    ? newStreak.lastPlayedDate
    : "";
  const latestLast = newLast > oldLast ? newLast : oldLast;
  const sourceForCurrent = newLast >= oldLast ? newStreak : oldStreak;
  result.streak = {
    current:
      typeof sourceForCurrent.current === "number" ? sourceForCurrent.current : 0,
    longest: Math.max(
      typeof oldStreak.longest === "number" ? oldStreak.longest : 0,
      typeof newStreak.longest === "number" ? newStreak.longest : 0,
    ),
    lastPlayedDate: latestLast || null,
    playedDates,
  };

  const oldGoal = asObject(oldSnapshot.dailyGoal);
  const newGoal = asObject(newSnapshot.dailyGoal);
  const oldGoalDate = typeof oldGoal.date === "string" ? oldGoal.date : "";
  const newGoalDate = typeof newGoal.date === "string" ? newGoal.date : "";
  if (newGoalDate > oldGoalDate) {
    result.dailyGoal = newGoal;
  } else if (oldGoalDate > newGoalDate) {
    result.dailyGoal = oldGoal;
  } else {
    result.dailyGoal = {
      ...oldGoal,
      ...newGoal,
      completed: Math.max(
        typeof oldGoal.completed === "number" ? oldGoal.completed : 0,
        typeof newGoal.completed === "number" ? newGoal.completed : 0,
      ),
    };
  }

  return result;
}

function getAuthenticatedUserId(req: Request, res: Response): string | null {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return userId;
}

router.get("/learner-progress", async (req, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  try {
    const [record] = await db
      .select()
      .from(learnerProgressTable)
      .where(eq(learnerProgressTable.userId, userId))
      .limit(1);
    res.json({
      snapshot: record?.snapshot ?? EMPTY,
      updatedAt: record?.updatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    req.log?.error({ err: error }, "Could not load learner progress");
    res.status(500).json({ error: "Could not load progress" });
  }
});

router.put("/learner-progress", async (req, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  if (!isObject(req.body) || !isObject(req.body.snapshot)) {
    res.status(400).json({ error: "A progress snapshot object is required" });
    return;
  }

  try {
    const incomingJson = JSON.stringify(req.body.snapshot);
    if (!incomingJson || Buffer.byteLength(incomingJson, "utf8") > 64 * 1024) {
      res.status(413).json({ error: "Progress snapshot is too large" });
      return;
    }

    const now = new Date();
    const snapshot = await db.transaction(async (tx) => {
      // Serialize saves from multiple devices for this learner so concurrent
      // requests cannot replace each other's merged record.
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${userId})::bigint)`,
      );
      const [existing] = await tx
        .select()
        .from(learnerProgressTable)
        .where(eq(learnerProgressTable.userId, userId))
        .limit(1);
      const merged = mergeSnapshots(existing?.snapshot, req.body.snapshot);
      await tx
        .insert(learnerProgressTable)
        .values({ userId, snapshot: merged, updatedAt: now })
        .onConflictDoUpdate({
          target: learnerProgressTable.userId,
          set: { snapshot: merged, updatedAt: now },
        });
      return merged;
      });

    res.json({ snapshot, updatedAt: now.toISOString() });
  } catch (error) {
    req.log?.error({ err: error }, "Could not save learner progress");
    res.status(500).json({ error: "Could not save progress" });
  }
});

export default router;
