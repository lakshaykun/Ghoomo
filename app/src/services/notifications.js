
/**
 * Notifications Service (Disabled)
 * 
 * Note: Remote push notifications via Expo Go are deprecated in SDK 53+.
 * This service has been disabled to prevent errors and warnings in development.
 */

const sentKeys = new Set();

export async function initializeNotifications() {
  console.log("[Notifications] Service is disabled.");
  return false;
}

export async function registerPushTokenForUser(userId) {
  // Disabled
  return null;
}

export async function unregisterPushTokenForUser(userId) {
  // Disabled
}

export async function sendLocalNotification({ title, body, data, key }) {
  // Disabled
  console.log("[Notifications] Local notification suppressed:", title);
}

export function clearNotificationKey(key) {
  if (key) sentKeys.delete(key);
}
