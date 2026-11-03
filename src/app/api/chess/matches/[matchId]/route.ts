import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase-admin";
import { getDrawOfferDecision } from "@/lib/chess/rematch-consent.mjs";
import { competitiveFeatures } from "@/lib/competitive/config";

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ matchId: string }> },
) {
  if (!competitiveFeatures.chessOnlineMatches) {
    return errorResponse("Online Chess matches are not enabled.", 503);
  }
  const uid = await authenticatedUid(request);
  if (!uid) return errorResponse("Sign in to view this Chess match.", 401);

  const { matchId } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(matchId)) {
    return errorResponse("Invalid match ID.", 400);
  }

  try {
    const { db } = getAdminServices();
    const snapshot = await db.collection("matches").doc(matchId).get();
    if (!snapshot.exists || snapshot.data()?.gameId !== "chess") return errorResponse("Chess match not found.", 404);
    const match = snapshot.data();
    const players = match?.playerIds;
    if (!Array.isArray(players) || !players.includes(uid)) {
      return errorResponse("You are not a player in this Chess match.", 403);
    }

    return NextResponse.json({
      matchId: snapshot.id,
      gameId: match?.gameId,
      mode: match?.mode,
      status: match?.status,
      whiteUid: match?.whiteUid,
      blackUid: match?.blackUid,
      turnUid: match?.turnUid ?? null,
      fen: match?.fen,
      pgn: match?.pgn ?? "",
      moveCount: match?.moveCount ?? 0,
      lastMove: match?.lastMove ?? null,
      result: match?.result ?? null,
      rematchStatus: match?.rematchStatus ?? null,
      rematchRequestedBy: Array.isArray(match?.rematchRequestedBy) ? match.rematchRequestedBy : [],
      rematchMatchId: match?.rematchMatchId ?? null,
      drawOffer: match?.drawOffer && typeof match.drawOffer.byUid === "string" ? { byUid: match.drawOffer.byUid, createdAt: match.drawOffer.createdAt?.toMillis?.() ?? null } : null,
      updatedAt: match?.updatedAt?.toMillis?.() ?? null,
    });
  } catch (error) {
    console.error("Chess match read error", error);
    return errorResponse("Could not load this Chess match.", 503);
  }
}


export async function POST(
  request: NextRequest,
  context: { params: Promise<{ matchId: string }> },
) {
  if (!competitiveFeatures.chessOnlineMatches) return errorResponse("Online Chess matches are not enabled.", 503);
  const uid = await authenticatedUid(request);
  if (!uid) return errorResponse("Sign in to manage a draw offer.", 401);
  const { matchId } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(matchId)) return errorResponse("Invalid match ID.", 400);
  let body: { action?: unknown };
  try { body = await request.json(); } catch { return errorResponse("Invalid request body.", 400); }
  if (!["offer", "accept", "decline", "cancel"].includes(String(body.action))) return errorResponse("Choose a valid draw-offer action.", 400);

  try {
    const { db } = getAdminServices();
    const matchRef = db.collection("matches").doc(matchId);
    const result = await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(matchRef);
      if (!snapshot.exists || snapshot.data()?.gameId !== "chess") return { error: "Chess match not found.", status: 404 as const };
      const match = snapshot.data();
      if (match?.status !== "active") return { error: "This Chess match is not active.", status: 409 as const };
      const decision = getDrawOfferDecision(match?.playerIds, match?.drawOffer, uid, body.action);
      if (decision.status === "forbidden") return { error: "You are not a player in this Chess match.", status: 403 as const };
      if (decision.status === "invalid") return { error: "Invalid draw-offer action.", status: 400 as const };
      if (decision.status === "conflict") return { error: "There is no draw offer you can act on, or the offer belongs to you.", status: 409 as const };

      if (decision.status === "accepted") {
        const players = match?.playerIds as string[];
        const lockRefs = players.map(playerUid => db.collection("chessActivePlayers").doc(playerUid));
        const locks = await Promise.all(lockRefs.map(lockRef => transaction.get(lockRef)));
        locks.forEach((lock, index) => { if (lock.data()?.matchId === matchId) transaction.delete(lockRefs[index]); });
        for (const playerUid of players) {
          for (const mode of ["quick", "ranked"] as const) transaction.delete(db.collection("chessQueues").doc(mode).collection("players").doc(playerUid));
        }
        transaction.update(matchRef, {
          status: "completed",
          turnUid: null,
          drawOffer: null,
          result: { winnerUid: null, reason: "agreed_draw", outcome: "draw" },
          completedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return { status: "accepted" as const };
      }
      transaction.update(matchRef, {
        drawOffer: decision.status === "offered" ? { byUid: uid, createdAt: FieldValue.serverTimestamp() } : null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { status: decision.status };
    });
    if ("error" in result) return errorResponse(result.error, result.status);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Chess draw-offer error", error);
    return errorResponse("Could not update the draw offer.", 503);
  }
}
