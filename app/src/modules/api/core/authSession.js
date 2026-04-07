let authToken = null;

export function setAuthToken(token) {
  if (typeof token !== "string") {
    authToken = null;
    return;
  }

  const trimmed = token.trim();
  authToken = trimmed.length > 0 ? trimmed : null;
}

export function getAuthToken() {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
}
