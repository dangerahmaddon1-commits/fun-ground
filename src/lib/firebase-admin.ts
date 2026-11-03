import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount(): { projectId: string; clientEmail: string; privateKey: string } {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Firebase Admin is not configured.");

  const parsed = JSON.parse(raw) as {
    projectId?: string;
    clientEmail?: string;
    privateKey?: string;
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };
  const projectId = parsed.projectId ?? parsed.project_id;
  const clientEmail = parsed.clientEmail ?? parsed.client_email;
  const privateKey = parsed.privateKey ?? parsed.private_key;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin service account is incomplete.");
  }
  return { projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, "\n") };
}

export function getAdminServices() {
  const existing = getApps()[0];
  const app = existing ?? initializeApp({ credential: cert(getServiceAccount()) });
  return { auth: getAuth(app), db: getFirestore(app) };
}
