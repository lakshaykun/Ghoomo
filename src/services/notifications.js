import { Platform } from "react-native";
import Constants from "expo-constants";
import { api } from "./api";

let Notifications = null;
const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === "storeClient";

if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (_error) {
    Notifications = null;
  }
}

const sentKeys = new Set();
let registeredPushToken = null;

export async function initializeNotifications() {
  if (!Notifications) return false;

  const permissions = await Notifications.getPermissionsAsync();
  let finalStatus = permissions.status;

  if (finalStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return finalStatus === "granted";
}

function getExpoProjectId() {
  const candidates = [
    Constants.easConfig?.projectId,
    Constants.expoConfig?.extra?.eas?.projectId,
    Constants.expoConfig?.extra?.projectId,
    Constants.expoConfig?.projectId,
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    process.env.EXPO_PUBLIC_PROJECT_ID,
  ];
  return candidates.find((value) => typeof value === "string" && value.trim().length > 0) || null;
}

export async function registerPushTokenForUser(userId) {
  if (!Notifications || !userId) return null;

  const granted = await initializeNotifications();
  if (!granted) return null;

  const projectId = getExpoProjectId();
  if (!projectId) return null;

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenResponse?.data || null;
  if (!token || token === registeredPushToken) return token;

  await api.registerPushToken(userId, token);
  registeredPushToken = token;
  return token;
}

export async function unregisterPushTokenForUser(userId) {
  if (!userId) return;
  try {
    await api.removePushToken(userId);
  } catch (_error) {
    // Ignore cleanup failures during logout.
  }
  registeredPushToken = null;
}

export async function sendLocalNotification({ title, body, data, key }) {
  if (!Notifications) return;
  if (!title || !body) return;
  if (key && sentKeys.has(key)) return;
  if (key) sentKeys.add(key);

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: "default",
    },
    trigger: null,
  });
}

export function clearNotificationKey(key) {
  if (key) sentKeys.delete(key);
}
