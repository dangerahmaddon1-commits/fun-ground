import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { Chess } from "chess.js";
import { getAdminServices } from "@/lib/firebase-admin";
import { competitiveFeatures } from "@/lib/competitive/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MatchMode = "quick" | "ranked";
const QUEUE_TTL_MS = 10 * 60 * 1000;
const MATCHMAKING_COOLDOWN_MS = 3_000;

async function authenticatedUser(request: NextRequest): Promise<{ uid: string; emailVerified: boolean } | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  try {
    const { auth } = getAdminServices();
    const decoded = await auth.verifyIdToken(token, true);
    return { uid: decoded.uid, emailVerified: decoded.email_verified === true };
  } catch {
    return null;
  }
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function validMode(value: unknown): value is MatchMode {
  return value === "quick" || value === "ranked";
}

function playersPath(mode: MatchMode) {
  return `chessQueues/${mode}/players`;
}

function isFresh(data: FirebaseFirestore.DocumentData | undefined, now: number) {
  const expiresAt = data?.expiresAt as Timestamp | undefined;
  return data?.status === "waiting" && expiresAt instanceof Timestamp && expiresAt.toMillis() > now;
}

export async function POST(request: NextRequest) {
  if (!competitiveFeatures.chessOnlineMatches) return errorResponse("Online Chess matchmaking is not enabled.", 503);
  const user = await authenticatedUser(request);
  if (!user) return errorResponse("Sign in to find a Chess opponent.", 401);

  let body: { mode?: unknown };
  try { body = await request.json(); } catch { return errorResponse("Invalid request body.", 400); }
  if (!validMode(body.mode)) return errorResponse("Choose Quick Match or Ranked Match.", 400);
  if (body.mode === "ranked" && !user.emailVerified) {
    return errorResponse("Verify your account email before entering Ranked Match.", 403);
  }
  if (body.mode === "ranked" && !competitiveFeatures.rankedMatches) {
    return errorResponse("Ranked Chess is not enabled yet.", 503);
  }

  try {
    const { db } = getAdminServices();
    const now = Date.now();
    const rateLimitRef = db.collection("matchmakingRateLimits").doc(user.uid);
    const allowed = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(rateLimitRef);
      const lastRequestAt = snapshot.data()?.lastRequestAt as Timestamp | undefined;
      if (
        lastRequestAt instanceof Timestamp &&
        now - lastRequestAt.toMillis() < MATCHMAKING_COOLDOWN_MS
      ) return false;
      transaction.set(rateLimitRef, { lastRequestAt: Timestamp.fromMillis(now) });
      return true;
    });
    if (!allowed) return errorResponse("Please wait a moment before trying matchmaking again.", 429);

    const players = db.collection(playersPath(body.mode));
    const ownRef = players.doc(user.uid);
    const candidates = await players.where("status", "==", "waiting").limit(20).get();
    const candidate = candidates.docs.find((doc) => doc.id !== user.uid);
    const matchRef = db.collection("matches").doc();
    const initialFen = new Chess().fen();

    const result = await db.runTransaction(async (transaction) => {
      const ownSnapshot = await transaction.get(ownRef);
      if (ownSnapshot.exists) {
        const ownData = ownSnapshot.data();
        if (ownData?.status === "matched" && typeof ownData.matchId === "string") {
          const existingMatchRef = db.collection("matches").doc(ownData.matchId);
          const existingMatch = await transaction.get(existingMatchRef);
          if (existingMatch.exists && ["active", "completed"].includes(String(existingMatch.data()?.status))) {
            return { status: "matched" as const, matchId: ownData.matchId };
          }
        }
        if (isFresh(ownData, now)) return { status: "queued" as const, queuedAt: ownData?.createdAt instanceof Timestamp ? ownData.createdAt.toMillis() : now };
      }

      if (candidate) {
        const candidateRef = players.doc(candidate.id);
        const candidateSnapshot = await transaction.get(candidateRef);
        const candidateData = candidateSnapshot.data();
        if (candidateSnapshot.exists && isFresh(candidateData, now)) {
          const whiteUid = candidate.id;
          const blackUid = user.uid;
          transaction.create(matchRef, {
            gameId: "chess",
            mode: body.mode,
            playerIds: [whiteUid, blackUid],
            whiteUid,
            blackUid,
            turnUid: whiteUid,
            status: "active",
            fen: initialFen,
            pgn: "",
            moveCount: 0,
            result: null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          transaction.set(candidateRef, {
            uid: whiteUid,
            mode: body.mode,
            status: "matched",
            matchId: matchRef.id,
            matchedAt: FieldValue.serverTimestamp(),
          });
          transaction.set(ownRef, {
            uid: user.uid,
            mode: body.mode,
            status: "matched",
            matchId: matchRef.id,
            matchedAt: FieldValue.serverTimestamp(),
          });
          return { status: "matched" as const, matchId: matchRef.id };
        }
        if (candidateSnapshot.exists && candidateData?.status === "waiting") {
          transaction.delete(candidateRef);
        }
      }

      transaction.set(ownRef, {
        uid: user.uid,
        mode: body.mode,
        status: "waiting",
        createdAt: Timestamp.fromMillis(now),
        expiresAt: Timestamp.fromMillis(now + QUEUE_TTL_MS),
      });
      return { status: "queued" as const, queuedAt: now };
    });

    return NextResponse.json(result, { status: result.status === "matched" ? 200 : 202 });
  } catch (error) {
    console.error("Chess matchmaking queue error", error);
    return errorResponse("Chess matchmaking is temporarily unavailable.", 503);
  }
}

export async function GET(request: NextRequest) {
  if (!competitiveFeatures.chessOnlineMatches) return errorResponse("Online Chess matchmaking is not enabled.", 503);
  const user = await authenticatedUser(request);
  if (!user) return errorResponse("Sign in to check Chess matchmaking.", 401);
  const modeValue = request.nextUrl.searchParams.get("mode");
  if (!validMode(modeValue)) return errorResponse("Choose Quick Match or Ranked Match.", 400);

  try {
    const { db } = getAdminServices();
    const ref = db.collection(playersPath(modeValue)).doc(user.uid);
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return { status: "not_queued" as const };
      const data = snapshot.data();
      if (data?.status === "matched" && typeof data.matchId === "string") {
        const matchRef = db.collection("matches").doc(data.matchId);
        const matchSnapshot = await transaction.get(matchRef);
        if (matchSnapshot.exists && ["active", "completed"].includes(String(matchSnapshot.data()?.status))) {
          return { status: "matched" as const, matchId: data.matchId };
        }
      }
      if (isFresh(data, Date.now())) return { status: "queued" as const, queuedAt: data?.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now() };
      transaction.delete(ref);
      return { status: "not_queued" as const };
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Chess matchmaking status error", error);
    return errorResponse("Could not check Chess matchmaking.", 503);
  }
}

export async function DELETE(request: NextRequest) {
  if (!competitiveFeatures.chessOnlineMatches) return errorResponse("Online Chess matchmaking is not enabled.", 503);
  const user = await authenticatedUser(request);
  if (!user) return errorResponse("Sign in to leave Chess matchmaking.", 401);
  let body: { mode?: unknown };
  try { body = await request.json(); } catch { return errorResponse("Invalid request body.", 400); }
  if (!validMode(body.mode)) return errorResponse("Choose Quick Match or Ranked Match.", 400);

  try {
    const { db } = getAdminServices();
    const ref = db.collection(playersPath(body.mode)).doc(user.uid);
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return "not_queued" as const;
      const data = snapshot.data();
      if (data?.status === "matched" && typeof data.matchId === "string") {
        const matchSnapshot = await transaction.get(db.collection("matches").doc(data.matchId));
        if (matchSnapshot.exists && ["active", "completed"].includes(String(matchSnapshot.data()?.status))) {
          return { status: "matched" as const, matchId: data.matchId };
        }
      }
      transaction.delete(ref);
      return "cancelled" as const;
    });
    if (typeof result === "object" && result.status === "matched") {
      return NextResponse.json({
        error: "A Chess match has already started; it cannot be cancelled from the queue.",
        matchId: result.matchId,
      }, { status: 409 });
    }
    return NextResponse.json({ status: result });
  } catch (error) {
    console.error("Chess matchmaking cancel error", error);
    return errorResponse("Could not leave Chess matchmaking.", 503);
  }
}
