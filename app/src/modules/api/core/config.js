import { Platform } from "react-native";
import Constants from "expo-constants";

const DEFAULT_PORT = "4000";

function getHostUri() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost ||
    "";

  return String(hostUri).split(":")[0];
}

export function getApiBaseUrl() {
  const explicitConfigured = process.env.EXPO_PUBLIC_API_BASE_URL || "";
  if (explicitConfigured) return explicitConfigured;

  const configured = Constants.expoConfig?.extra?.apiBaseUrl || "";
  if (configured && !/localhost|127\.0\.0\.1/.test(configured)) return configured;

  const expoHost = getHostUri();
  if (expoHost) return `http://${expoHost}:${DEFAULT_PORT}`;

  if (configured) return configured;
  if (Platform.OS === "android") return `http://10.0.2.2:${DEFAULT_PORT}`;
  return `http://localhost:${DEFAULT_PORT}`;
}
