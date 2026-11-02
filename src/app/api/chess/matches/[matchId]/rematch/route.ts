import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { Chess } from "chess.js";
import { getAdminServices } from "@/lib/firebase-admin";
import { competitiveFeatures } from "@/lib/competitive/config";
import {
  getRematchLockDecision,
  getRematchRequestDecision,
} from "@/lib/chess/rematch-consent.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authenticatedUid(request: NextRequest): Promise<string | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  try {
    const { auth } = getAdminServices();
    return (await auth.verifyIdToken(token, true)).uid;
  } catch {
    return null;
  }
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ matchId: string }> },
) {
  if (!competitiveFeatures.chessOnlineMatches) {
    return errorResponse("Online Chess matches are not enabled.", 503);
  }
  const uid = await authenticatedUid(request);
  if (!uid) return errorResponse("Sign in to request a rematch.", 401);

  const { matchId } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(matchId)) {
    return errorResponse("Invalid match ID.", 400);
  }

  try {
    const { db } = getAdminServices();
    const matchRef = db.collection("matches").doc(matchId);
    const rematchRef = db.collection("matches").doc();
    const outcome = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(matchRef);
      if (!snapshot.exists || snapshot.data()?.gameId !== "chess") {
        return { error: "Chess match not found.", httpStatus: 404 as const };
      }
      const match = snapshot.data();
      if (match?.status !== "completed") {
        return { error: "A rematch can be requested after the current game finishes.", httpStatus: 409 as const };
      }
      if (
        (match.mode !== "quick" && match.mode !== "ranked")
        || typeof match.whiteUid !== "string"
        || typeof match.blackUid !== "string"
        || match.whiteUid === match.blackUid
        || !Array.isArray(match.playerIds)
        || match.playerIds.length !== 2
        || !match.playerIds.includes(match.whiteUid)
        || !match.playerIds.includes(match.blackUid)
      ) {
        return { error: "The saved Chess match cannot be replayed.", httpStatus: 409 as const };
      }

      const decision = getRematchRequestDecision(match.playerIds, match.rematchRequestedBy, uid);
      if (decision.status === "forbidden") {
        return { error: "You are not a player in this Chess match.", httpStatus: 403 as const };
      }
      if (typeof match.rematchMatchId === "string") {
        return { status: "matched" as const, matchId: match.rematchMatchId };
      }
      if (decision.status === "waiting") {
        transaction.update(matchRef, {
          rematchRequestedBy: decision.requestedBy,
          rematchStatus: "waiting",
          updatedAt: FieldValue.serverTimestamp(),
        });
        return { status: "waiting" as const };
      }

      const playerIds = [match.whiteUid, match.blackUid];
      const lockRefs = playerIds.map(playerUid => db.collection("chessActivePlayers").doc(playerUid));
      const queueRefs = playerIds.flatMap(playerUid => (["quick", "ranked"] as const).map(mode =>
        db.collection("chessQueues").doc(mode).collection("players").doc(playerUid),
      ));
      const [lockSnapshots, queueSnapshots] = await Promise.all([
        Promise.all(lockRefs.map(lockRef => transaction.get(lockRef))),
        Promise.all(queueRefs.map(queueRef => transaction.get(queueRef))),
      ]);

      const lockMatchRefs = lockSnapshots.map(lockSnapshot => {
        const lockedMatchId = lockSnapshot.data()?.matchId;
        return typeof lockedMatchId === "string" ? db.collection("matches").doc(lockedMatchId) : null;
      });
      const lockMatchSnapshots = await Promise.all(lockMatchRefs.map(lockMatchRef =>
        lockMatchRef ? transaction.get(lockMatchRef) : Promise.resolve(null),
      ));
      const activeLockOwners = lockSnapshots.flatMap((lockSnapshot, index) =>
        lockSnapshot.exists && lockMatchSnapshots[index]?.exists
          && lockMatchSnapshots[index]?.data()?.status === "active"
          ? [playerIds[index]]
          : [],
      );
      const lockDecision = getRematchLockDecision(playerIds, activeLockOwners);
      if (lockDecision.status === "conflict") {
        return {
          error: "One of these players is already in another active Chess match.",
          httpStatus: 409 as const,
        };
      }
      if (lockDecision.status === "invalid") {
        return { error: "The saved Chess match cannot be replayed.", httpStatus: 409 as const };
      }

      const nextWhiteUid = match.blackUid;
      const nextBlackUid = match.whiteUid;
      transaction.create(rematchRef, {
        gameId: "chess",
        mode: match.mode,
        playerIds: [nextWhiteUid, nextBlackUid],
        whiteUid: nextWhiteUid,
        blackUid: nextBlackUid,
        turnUid: nextWhiteUid,
        status: "active",
        fen: new Chess().fen(),
        pgn: "",
        moveCount: 0,
        result: null,
        rematchOf: matchId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(matchRef, {
        rematchRequestedBy: decision.requestedBy,
        rematchStatus: "created",
        rematchMatchId: rematchRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      });
      for (const lockRef of lockRefs) {
        transaction.set(lockRef, {
          matchId: rematchRef.id,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      for (const queueRef of queueRefs) transaction.delete(queueRef);
      return { status: "matched" as const, matchId: rematchRef.id };
    });

    if ("error" in outcome) return errorResponse(outcome.error ?? "Could not request a rematch.", outcome.httpStatus ?? 500);
    return NextResponse.json(outcome);
  } catch (error) {
    console.error("Chess rematch request error", error);
    return errorResponse("Could not request a rematch.", 503);
  }
}
