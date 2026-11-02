import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase-admin";
import { competitiveFeatures } from "@/lib/competitive/config";
import { getCapabilities } from "@/lib/competitive/capabilities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MatchMode = "quick" | "ranked";
const QUEUE_TTL_MS = 90_000;
const MATCHMAKING_POST_COOLDOWN_MS = 3_000;

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

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function validGameId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
}

function validMode(value: unknown): value is MatchMode {
  return value === "quick" || value === "ranked";
}

function queuePath(gameId: string, mode: MatchMode) {
  return `battleQueues/${gameId}-${mode}/players`;
}

export async function POST(request: NextRequest) {
  if (!competitiveFeatures.matchmaking) return jsonError("Matchmaking is not enabled.", 503);
  const user = await authenticatedUser(request);
  if (!user) return jsonError("Sign in to join matchmaking.", 401);
  const { uid } = user;

  let body: { gameId?: unknown; mode?: unknown };
  try { body = await request.json(); } catch { return jsonError("Invalid request body.", 400); }
  if (!validGameId(body.gameId) || !validMode(body.mode)) {
    return jsonError("A valid gameId and match mode are required.", 400);
  }

  const capabilities = getCapabilities({ id: body.gameId });
  if (!capabilities.includes("multiplayer-supported")) {
    return jsonError("This game has not been approved for Fun Ground multiplayer.", 409);
  }
  if (body.mode === "ranked" && !user.emailVerified) {
    return jsonError("Verify your account email before entering Ranked Match.", 403);
  }
  if (body.mode === "ranked" &&
      (!competitiveFeatures.rankedMatches || !capabilities.includes("results-verified"))) {
    return jsonError("Ranked play is not available for this game.", 409);
  }

  try {
    const { db } = getAdminServices();
    const now = Date.now();
    const rateLimitRef = db.collection("matchmakingRateLimits").doc(uid);
    const allowed = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(rateLimitRef);
      const lastRequestAt = snapshot.data()?.lastRequestAt as Timestamp | undefined;
      if (
        lastRequestAt instanceof Timestamp &&
        now - lastRequestAt.toMillis() < MATCHMAKING_POST_COOLDOWN_MS
      ) {
        return false;
      }
      transaction.set(rateLimitRef, { lastRequestAt: Timestamp.fromMillis(now) });
      return true;
    });
    if (!allowed) {
      return jsonError("Please wait a moment before trying matchmaking again.", 429);
    }

    const players = db.collection(queuePath(body.gameId, body.mode));
    const ownRef = players.doc(uid);
    const candidates = await players.where("status", "==", "waiting").limit(20).get();
    const candidate = candidates.docs.find((doc) => doc.id !== uid);
    const matchRef = db.collection("matches").doc();

    const result = await db.runTransaction(async (transaction) => {
      const own = await transaction.get(ownRef);
      if (own.exists) {
        const data = own.data();
        if (data?.status === "matched" && typeof data.matchId === "string") {
          return { status: "matched" as const, matchId: data.matchId };
        }
        if (data?.status === "waiting") {
          const expiresAt = data.expiresAt as Timestamp | undefined;
          if (expiresAt instanceof Timestamp && expiresAt.toMillis() > now) {
            return { status: "queued" as const };
          }
        }
      }

      if (candidate) {
        const candidateRef = players.doc(candidate.id);
        const candidateSnapshot = await transaction.get(candidateRef);
        const candidateData = candidateSnapshot.data();
        const createdAt = candidateData?.createdAt as Timestamp | undefined;
        const fresh = candidateSnapshot.exists &&
          candidateData?.status === "waiting" &&
          createdAt instanceof Timestamp &&
          createdAt.toMillis() >= now - QUEUE_TTL_MS;

        if (fresh) {
          transaction.create(matchRef, {
            gameId: body.gameId,
            mode: body.mode,
            playerIds: [candidate.id, uid],
            status: "matched",
            resultStatus: "unverified",
            createdAt: FieldValue.serverTimestamp(),
          });
          transaction.update(candidateRef, { status: "matched", matchId: matchRef.id, matchedAt: FieldValue.serverTimestamp() });
          transaction.set(ownRef, {
            uid, gameId: body.gameId, mode: body.mode, status: "matched",
            matchId: matchRef.id, createdAt: FieldValue.serverTimestamp(),
            matchedAt: FieldValue.serverTimestamp(),
          });
          return { status: "matched" as const, matchId: matchRef.id };
        }
        if (candidateSnapshot.exists && candidateData?.status === "waiting") {
          transaction.delete(candidateRef);
        }
      }

      transaction.set(ownRef, {
        uid, gameId: body.gameId, mode: body.mode, status: "waiting",
        createdAt: Timestamp.fromMillis(now),
        expiresAt: Timestamp.fromMillis(now + QUEUE_TTL_MS),
      });
      return { status: "queued" as const };
    });

    return NextResponse.json(result, { status: result.status === "matched" ? 200 : 202 });
  } catch (error) {
    console.error("Matchmaking queue error", error);
    return jsonError("Matchmaking is temporarily unavailable.", 503);
  }
}

export async function GET(request: NextRequest) {
  if (!competitiveFeatures.matchmaking) return jsonError("Matchmaking is not enabled.", 503);
  const user = await authenticatedUser(request);
  if (!user) return jsonError("Sign in to check matchmaking.", 401);
  const { uid } = user;
  const gameId = request.nextUrl.searchParams.get("gameId");
  const mode = request.nextUrl.searchParams.get("mode");
  if (!validGameId(gameId) || !validMode(mode)) return jsonError("A valid gameId and match mode are required.", 400);

  try {
    const { db } = getAdminServices();
    const ref = db.collection(queuePath(gameId, mode)).doc(uid);
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return { status: "not_queued" as const };
      const data = snapshot.data();
      if (data?.status === "matched" && typeof data.matchId === "string") {
        return { status: "matched" as const, matchId: data.matchId };
      }
      if (data?.status === "waiting") {
        const expiresAt = data.expiresAt as Timestamp | undefined;
        if (expiresAt instanceof Timestamp && expiresAt.toMillis() > Date.now()) {
          return { status: "queued" as const };
        }
      }
      transaction.delete(ref);
      return { status: "not_queued" as const };
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Matchmaking status error", error);
    return jsonError("Matchmaking status is temporarily unavailable.", 503);
  }
}

export async function DELETE(request: NextRequest) {
  if (!competitiveFeatures.matchmaking) return jsonError("Matchmaking is not enabled.", 503);
  const user = await authenticatedUser(request);
  if (!user) return jsonError("Sign in to leave matchmaking.", 401);
  const { uid } = user;
  let body: { gameId?: unknown; mode?: unknown };
  try { body = await request.json(); } catch { return jsonError("Invalid request body.", 400); }
  if (!validGameId(body.gameId) || !validMode(body.mode)) return jsonError("A valid gameId and match mode are required.", 400);

  try {
    const { db } = getAdminServices();
    const ref = db.collection(queuePath(body.gameId, body.mode)).doc(uid);
    const outcome = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return "not_queued" as const;
      if (snapshot.data()?.status === "matched") return "matched" as const;
      transaction.delete(ref);
      return "cancelled" as const;
    });
    if (outcome === "matched") return jsonError("A match has already been created; it cannot be cancelled from the queue.", 409);
    return NextResponse.json({ status: outcome });
  } catch (error) {
    console.error("Matchmaking cancel error", error);
    return jsonError("Could not leave matchmaking right now.", 503);
  }
}
