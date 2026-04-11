import { env, hasTurnstile } from "@/lib/env";

type VerifyTurnstileResult = {
  success: boolean;
  errorCode?: string;
};

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<VerifyTurnstileResult> {
  if (!hasTurnstile) {
    return { success: true };
  }

  // In development, bypass Turnstile (widget is usually not configured for localhost)
  if (process.env.NODE_ENV === "development") {
    return { success: true };
  }

  const normalizedToken = token?.trim();

  if (!normalizedToken) {
    return { success: false, errorCode: "missing-token" };
  }

  const body = new URLSearchParams({
    secret: env.turnstileSecretKey!,
    response: normalizedToken,
  });

  if (remoteIp?.trim()) {
    body.set("remoteip", remoteIp.trim());
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
    });

    if (!response.ok) {
      return { success: false, errorCode: `http-${response.status}` };
    }

    const result = (await response.json()) as TurnstileResponse;

    if (!result.success) {
      return {
        success: false,
        errorCode: result["error-codes"]?.join(",") || "verification-failed",
      };
    }

    return { success: true };
  } catch {
    // On network errors, allow through (graceful degradation — Cloudflare outage etc.)
    console.warn("[Turnstile] Network error during verification, allowing through");
    return { success: true };
  }
}
