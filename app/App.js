
import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, NativeModules, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { enableScreens } from "react-native-screens";
import { store } from "./src/store";
import RootNavigator from "./src/navigation/RootNavigator";
import { initializeNotifications } from "./src/services/notifications";
import { checkAndApplyOtaUpdate } from "./src/services/appUpdate";
import { hydrateAuthSession } from "./src/store/slices/authSlice";
import { COLORS } from "./src/constants";

enableScreens(false);

function AppBootstrap() {
  const dispatch = useDispatch();
  const hydrated = useSelector((state) => state.auth.hydrated);

  useEffect(() => {
    dispatch(hydrateAuthSession());
  }, [dispatch]);

  if (!hydrated) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <RootNavigator />;
}

export default function App() {
  useEffect(() => {
    // Load Vexo only when the iOS/Android native module is actually linked.
    if (NativeModules.RNVexo && process.env.VEXO_API_KEY) {
      try {
        const { vexo } = require("vexo-analytics");
        vexo(process.env.VEXO_API_KEY);
      } catch (error) {
        console.warn("[Vexo] Failed to initialize:", error?.message || error);
      }
    }

    initializeNotifications().catch(() => {});

    const updateTimer = setTimeout(() => {
      checkAndApplyOtaUpdate().catch(() => {});
    }, 2000);

    return () => clearTimeout(updateTimer);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Provider store={store}>
          <StatusBar style="auto" />
          <AppBootstrap />
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
});
