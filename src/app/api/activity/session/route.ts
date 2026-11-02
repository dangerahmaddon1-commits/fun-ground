import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase-admin";
import { competitiveFeatures } from "@/lib/competitive/config";
import { getGames } from "@/lib/games";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_SESSION_SECONDS = 4 * 60 * 60;

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

export async function POST(request: NextRequest) {
  if (!competitiveFeatures.activityTracking) return errorResponse("Activity tracking is not enabled.", 503);
  const uid = await authenticatedUid(request);
  if (!uid) return errorResponse("Sign in to track play sessions.", 401);

  let body: { gameId?: unknown };
  try { body = await request.json(); } catch { return errorResponse("Invalid request body.", 400); }
  if (typeof body.gameId !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(body.gameId)) {
    return errorResponse("A valid gameId is required.", 400);
  }
  if (!getGames().some((game) => game.id === body.gameId)) {
    return errorResponse("Game not found.", 404);
  }

  try {
    const { db } = getAdminServices();
    const ref = db.collection("playerActivity").doc(uid).collection("sessions").doc();
    await ref.create({
      uid,
      gameId: body.gameId,
      status: "active",
      startedAt: FieldValue.serverTimestamp(),
      startedAtMs: Date.now(),
    });
    return NextResponse.json({ sessionId: ref.id }, { status: 201 });
  } catch (error) {
    console.error("Activity session start error", error);
    return errorResponse("Could not start activity tracking.", 503);
  }
}

export async function PATCH(request: NextRequest) {
  if (!competitiveFeatures.activityTracking) return errorResponse("Activity tracking is not enabled.", 503);
  const uid = await authenticatedUid(request);
  if (!uid) return errorResponse("Sign in to update play sessions.", 401);

  let body: { sessionId?: unknown };
  try { body = await request.json(); } catch { return errorResponse("Invalid request body.", 400); }
  if (typeof body.sessionId !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(body.sessionId)) {
    return errorResponse("A valid sessionId is required.", 400);
  }

  try {
    const { db } = getAdminServices();
    const ref = db.collection("playerActivity").doc(uid).collection("sessions").doc(body.sessionId);
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return { status: "not_found" as const };
      const data = snapshot.data();
      if (data?.status !== "active" || typeof data.startedAtMs !== "number") {
        return { status: "already_closed" as const };
      }
      const durationSeconds = Math.max(0, Math.min(
        MAX_SESSION_SECONDS,
        Math.floor((Date.now() - data.startedAtMs) / 1000),
      ));
      transaction.update(ref, {
        status: "completed",
        endedAt: FieldValue.serverTimestamp(),
        durationSeconds,
      });
      return { status: "completed" as const, durationSeconds };
    });
    if (result.status === "not_found") return errorResponse("Session not found.", 404);
    if (result.status === "already_closed") return NextResponse.json({ status: "already_closed" });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Activity session stop error", error);
    return errorResponse("Could not finish activity tracking.", 503);
  }
}
