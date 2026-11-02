import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ matchId: string }> },
) {
  if (!competitiveFeatures.chessOnlineMatches) {
    return errorResponse("Online Chess matches are not enabled.", 503);
  }
  const uid = await authenticatedUid(request);
  if (!uid) return errorResponse("Sign in to resign from this Chess match.", 401);

  const { matchId } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(matchId)) {
    return errorResponse("Invalid match ID.", 400);
  }

  try {
    const { db } = getAdminServices();
    const matchRef = db.collection("matches").doc(matchId);
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(matchRef);
      if (!snapshot.exists) return { error: "Chess match not found.", status: 404 as const };
      const match = snapshot.data();
      const players = match?.playerIds;
      if (!Array.isArray(players) || !players.includes(uid)) {
        return { error: "You are not a player in this Chess match.", status: 403 as const };
      }
      if (match?.status === "completed") {
        return { status: "already_completed" as const, result: match.result ?? null };
      }
      if (match?.status !== "active") {
        return { error: "This Chess match is not active.", status: 409 as const };
      }

      const opponentUid = players.find((playerId: unknown) => playerId !== uid);
      if (typeof opponentUid !== "string") {
        return { error: "Chess match participants are invalid.", status: 500 as const };
      }
      const matchResult = {
        winnerUid: opponentUid,
        reason: "resignation",
        outcome: "win",
      };
      transaction.update(matchRef, {
        status: "completed",
        turnUid: null,
        result: matchResult,
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { status: "completed" as const, result: matchResult };
    });

    if ("error" in result && typeof result.error === "string") {
      return errorResponse(result.error, result.status ?? 500);
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Chess resignation error", error);
    return errorResponse("Could not resign from this Chess match.", 503);
  }
}
