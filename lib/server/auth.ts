import { getAdminAuth } from "@/lib/server/firebaseAdmin";

export async function getAuthenticatedUserId(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token) {
    throw new Error("Authentication required.");
  }

  const decoded = await getAdminAuth().verifyIdToken(token);
  if (!decoded?.uid) {
    throw new Error("Invalid authentication token.");
  }

  return decoded.uid;
}
