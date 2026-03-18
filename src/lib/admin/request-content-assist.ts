type RequestContentAssistParams = {
  title: string;
  content: string;
};

type RequestContentAssistResponse = {
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
};

type ApiResponse =
  | {
      ok: true;
      data: RequestContentAssistResponse;
    }
  | {
      ok: false;
      message?: string;
    };

export async function requestContentAssist({
  title,
  content,
}: RequestContentAssistParams): Promise<RequestContentAssistResponse> {
  const response = await fetch("/api/admin/content-assist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      content,
    }),
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse | null;
  if (!response.ok || !payload || !payload.ok) {
    throw new Error(payload && "message" in payload ? payload.message || "AI request failed." : "AI request failed.");
  }

  return payload.data;
}
