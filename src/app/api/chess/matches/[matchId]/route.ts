import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";
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
    if (!snapshot.exists) return errorResponse("Chess match not found.", 404);
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
      updatedAt: match?.updatedAt?.toMillis?.() ?? null,
    });
  } catch (error) {
    console.error("Chess match read error", error);
    return errorResponse("Could not load this Chess match.", 503);
  }
}
