import { Alert } from "react-native";
import * as Updates from "expo-updates";

function canUseOverTheAirUpdates() {
  return Updates.isEnabled && !__DEV__;
}

export async function checkAndApplyOtaUpdate() {
  if (!canUseOverTheAirUpdates()) {
    return { checked: false, applied: false, reason: "disabled" };
  }

  try {
    const update = await Updates.checkForUpdateAsync();

    if (!update?.isAvailable) {
      return { checked: true, applied: false, reason: "none" };
    }

    await Updates.fetchUpdateAsync();

    Alert.alert(
      "Update available",
      "A new version is ready. Restart now to apply the update.",
      [
        { text: "Later", style: "cancel" },
        {
          text: "Restart",
          onPress: () => {
            Updates.reloadAsync().catch(() => {});
          },
        },
      ],
      { cancelable: true }
    );

    return { checked: true, applied: true, reason: "fetched" };
  } catch (error) {
    console.warn("[Updates] OTA check failed", error?.message || error);
    return { checked: true, applied: false, reason: "error" };
  }
}
