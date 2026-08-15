type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function buildHeaders(init?: HeadersInit, body?: unknown): HeadersInit {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
  const headers = new Headers(init ?? {});

  if (!headers.has("Content-Type") && body !== undefined && body !== null && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function request<T = Response>(
  method: HttpMethod,
  url: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    method,
    ...init,
    headers: buildHeaders(init?.headers, body),
    body: body !== undefined && body !== null && !(body instanceof FormData)
      ? JSON.stringify(body)
      : body instanceof FormData
        ? body
        : undefined,
  });

  return response as T;
}

export const apiClient = {
  get: (url: string, init?: RequestInit) => request("GET", url, undefined, init),
  post: (url: string, body?: unknown, init?: RequestInit) => request("POST", url, body, init),
  put: (url: string, body?: unknown, init?: RequestInit) => request("PUT", url, body, init),
  patch: (url: string, body?: unknown, init?: RequestInit) => request("PATCH", url, body, init),
  delete: (url: string, init?: RequestInit) => request("DELETE", url, undefined, init),
  request,
};

export default apiClient;
