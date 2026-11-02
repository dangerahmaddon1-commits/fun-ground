import { NextRequest, NextResponse } from "next/server";
import { Chess, type Square } from "chess.js";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase-admin";
import { competitiveFeatures } from "@/lib/competitive/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MoveRequest = {
  clientMoveId?: unknown;
  from?: unknown;
  to?: unknown;
  promotion?: unknown;
};

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

const validSquare = (value: unknown): value is Square =>
  typeof value === "string" && /^[a-h][1-8]$/.test(value);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ matchId: string }> },
) {
  if (!competitiveFeatures.chessOnlineMatches) {
    return errorResponse("Online Chess matches are not enabled.", 503);
  }
  const uid = await authenticatedUid(request);
  if (!uid) return errorResponse("Sign in to submit a Chess move.", 401);

  const { matchId } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(matchId)) {
    return errorResponse("Invalid match ID.", 400);
  }

  let body: MoveRequest;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.", 400);
  }
  if (
    typeof body.clientMoveId !== "string" ||
    !/^[a-zA-Z0-9_-]{8,100}$/.test(body.clientMoveId) ||
    !validSquare(body.from) ||
    !validSquare(body.to) ||
    (body.promotion !== undefined && !["q", "r", "b", "n"].includes(String(body.promotion)))
  ) {
    return errorResponse("A valid move ID, source, destination and promotion are required.", 400);
  }

  try {
    const { db } = getAdminServices();
    const matchRef = db.collection("matches").doc(matchId);
    const moveRef = matchRef.collection("moves").doc(body.clientMoveId);
    const outcome = await db.runTransaction(async (transaction) => {
      const [matchSnapshot, priorMove] = await Promise.all([
        transaction.get(matchRef),
        transaction.get(moveRef),
      ]);
      if (!matchSnapshot.exists) return { error: "Chess match not found.", status: 404 as const };
      if (priorMove.exists) {
        const current = matchSnapshot.data();
        if (!Array.isArray(current?.playerIds) || !current.playerIds.includes(uid)) {
          return { error: "You are not a player in this Chess match.", status: 403 as const };
        }
        return { duplicate: true as const, fen: current?.fen, pgn: current?.pgn ?? "", status: current?.status };
      }

      const match = matchSnapshot.data();
      const players = match?.playerIds;
      if (!Array.isArray(players) || !players.includes(uid)) {
        return { error: "You are not a player in this Chess match.", status: 403 as const };
      }
      if (match?.status !== "active") {
        return { error: "This Chess match is not active.", status: 409 as const };
      }
      if (match?.turnUid !== uid) {
        return { error: "It is not your turn.", status: 409 as const };
      }
      if (typeof match?.fen !== "string" || typeof match?.whiteUid !== "string" || typeof match?.blackUid !== "string") {
        return { error: "Chess match state is invalid.", status: 500 as const };
      }

      let chess: Chess;
      try {
        chess = new Chess(match.fen);
      } catch {
        return { error: "Saved Chess position is invalid.", status: 500 as const };
      }

      const expectedColor = uid === match.whiteUid ? "w" : uid === match.blackUid ? "b" : null;
      if (!expectedColor || chess.turn() !== expectedColor) {
        return { error: "Match turn does not match the saved board.", status: 409 as const };
      }

      let played;
      try {
        played = chess.move({
          from: body.from as Square,
          to: body.to as Square,
          ...(body.promotion ? { promotion: body.promotion as "q" | "r" | "b" | "n" } : {}),
        });
      } catch {
        return { error: "That move is not legal.", status: 400 as const };
      }

      const completed = chess.isGameOver();
      const winnerUid = chess.isCheckmate() ? uid : null;
      const reason = chess.isCheckmate()
        ? "checkmate"
        : chess.isStalemate()
          ? "stalemate"
          : chess.isThreefoldRepetition()
            ? "threefold-repetition"
            : chess.isInsufficientMaterial()
              ? "insufficient-material"
              : chess.isDraw()
                ? "draw"
                : null;
      const nextUid = chess.turn() === "w" ? match.whiteUid : match.blackUid;
      const result = completed
        ? { winnerUid, reason, outcome: winnerUid ? "win" : "draw" }
        : null;

      transaction.create(moveRef, {
        clientMoveId: body.clientMoveId,
        uid,
        from: played.from,
        to: played.to,
        promotion: played.promotion ?? null,
        san: played.san,
        fenAfter: chess.fen(),
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.update(matchRef, {
        fen: chess.fen(),
        pgn: chess.pgn(),
        turnUid: completed ? null : nextUid,
        moveCount: (typeof match.moveCount === "number" ? match.moveCount : 0) + 1,
        lastMove: {
          from: played.from,
          to: played.to,
          san: played.san,
          promotion: played.promotion ?? null,
          byUid: uid,
        },
        status: completed ? "completed" : "active",
        ...(completed ? { result, completedAt: FieldValue.serverTimestamp() } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        duplicate: false as const,
        fen: chess.fen(),
        pgn: chess.pgn(),
        status: completed ? "completed" : "active",
        turnUid: completed ? null : nextUid,
        result,
        lastMove: { from: played.from, to: played.to, san: played.san },
      };
    });

    if ("error" in outcome && typeof outcome.error === "string") return errorResponse(outcome.error, outcome.status ?? 500);
    return NextResponse.json(outcome);
  } catch (error) {
    console.error("Chess move submission error", error);
    return errorResponse("Could not submit this Chess move.", 503);
  }
}
