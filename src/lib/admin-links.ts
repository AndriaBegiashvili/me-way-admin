import crypto from "crypto";

const DEFAULT_PRODUCTION_MAIN_APP = "https://meway.ge";
const DEFAULT_DEV_MAIN_APP = "http://localhost:3001";
const DEFAULT_TTL_SECONDS = 1800;

/**
 * Canonical public URL of the main Meway web app (used for SSO / deep links).
 * Set `NEXT_PUBLIC_MAIN_APP_URL=https://meway.ge` on Vercel for the admin project.
 */
function getMainAppBaseUrl() {
  const configured =
    (process.env.NEXT_PUBLIC_MAIN_APP_URL || process.env.NEXT_PUBLIC_API_URL || "").trim();

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return DEFAULT_DEV_MAIN_APP;
  }

  return DEFAULT_PRODUCTION_MAIN_APP;
}

function getSharedSecret() {
  const secret = process.env.ADMIN_SSO_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_SSO_SECRET in admin-panel environment.");
  }
  return secret;
}

function signPayload(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function createMainAppUrl(targetPath: string, impersonateUserId?: string | null) {
  const normalizedTarget = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
  const exp = Math.floor(Date.now() / 1000) + DEFAULT_TTL_SECONDS;
  const uid = impersonateUserId ?? "";
  const secret = getSharedSecret();
  const payload = `${normalizedTarget}|${uid}|${exp}`;
  const sig = signPayload(payload, secret);
  const params = new URLSearchParams({
    target: normalizedTarget,
    exp: String(exp),
    sig,
  });
  if (uid) {
    params.set("uid", uid);
  }
  return `${getMainAppBaseUrl()}/api/admin/open?${params.toString()}`;
}
