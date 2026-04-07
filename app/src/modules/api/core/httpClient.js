import { getApiBaseUrl } from "./config";
import { getAuthToken } from "./authSession";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tryParseJson(text) {
  if (!text || typeof text !== "string") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function createApiError(message, meta = {}) {
  const error = new Error(message);
  error.status = meta.status;
  error.code = meta.code;
  error.details = meta.details;
  error.path = meta.path;
  return error;
}

function extractErrorMessage(payload, fallbackMessage) {
  return (
    payload?.error?.message ||
    payload?.message ||
    payload?.error ||
    fallbackMessage
  );
}

function unwrapPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (!Object.prototype.hasOwnProperty.call(payload, "success")) {
    return payload;
  }

  if (payload.success === false) {
    throw createApiError(extractErrorMessage(payload, "Request failed"), {
      status: 400,
      code: payload?.error?.code,
      details: payload?.error?.details,
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data;
  }

  return payload;
}

function shouldRetry(error, attempt, maxRetries) {
  if (attempt >= maxRetries) return false;
  if (error?.name === "AbortError") return false;
  if (typeof error?.status === "number" && (error.status >= 500 || error.status === 409 || error.status === 429)) {
    return true;
  }

  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("concurrent")
  );
}

export async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    auth = true,
    timeoutMs = 30000,
    maxRetries = 1,
    retryDelay = 300,
    baseUrl = getApiBaseUrl(),
  } = options;

  const url = `${baseUrl}${path}`;
  let attempt = 0;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const token = auth ? getAuthToken() : null;
      const shouldAttachBody = body !== undefined && body !== null;

      const requestHeaders = {
        Accept: "application/json",
        ...(shouldAttachBody ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      };

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: shouldAttachBody ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
        signal: controller.signal,
      });

      const textPayload = await response.text();
      const parsedPayload = tryParseJson(textPayload);

      if (!response.ok) {
        const message = extractErrorMessage(
          parsedPayload,
          `HTTP ${response.status}: Request failed`
        );

        throw createApiError(message, {
          status: response.status,
          code: parsedPayload?.error?.code,
          details: parsedPayload?.error?.details,
          path,
        });
      }

      if (!parsedPayload && textPayload) {
        return textPayload;
      }

      return unwrapPayload(parsedPayload);
    } catch (error) {
      if (error?.name === "AbortError") {
        throw createApiError(`Request timeout after ${timeoutMs}ms`, {
          status: 408,
          code: "TIMEOUT",
          path,
        });
      }

      if (shouldRetry(error, attempt, maxRetries)) {
        attempt += 1;
        await sleep(retryDelay * attempt);
        continue;
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw createApiError("Request failed after retries", { path });
}

export const httpClient = {
  get: (path, options = {}) => request(path, { ...options, method: "GET" }),
  post: (path, options = {}) => request(path, { ...options, method: "POST" }),
  patch: (path, options = {}) => request(path, { ...options, method: "PATCH" }),
  put: (path, options = {}) => request(path, { ...options, method: "PUT" }),
  delete: (path, options = {}) => request(path, { ...options, method: "DELETE" }),
};
