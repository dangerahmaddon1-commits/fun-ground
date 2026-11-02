import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount(): { projectId: string; clientEmail: string; privateKey: string } {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Firebase Admin is not configured.");
  const parsed = JSON.parse(raw) as { projectId?: string; clientEmail?: string; privateKey?: string };
  if (!parsed.projectId || !parsed.clientEmail || !parsed.privateKey) {
    throw new Error("Firebase Admin service account is incomplete.");
  }
  return { projectId: parsed.projectId, clientEmail: parsed.clientEmail, privateKey: parsed.privateKey };
}

export function getAdminServices() {
  const existing = getApps()[0];
  const app = existing ?? initializeApp({ credential: cert(getServiceAccount()) });
  return { auth: getAuth(app), db: getFirestore(app) };
}
