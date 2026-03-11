
import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { store } from "./src/store";
import RootNavigator from "./src/navigation/RootNavigator";
import { initializeNotifications } from "./src/services/notifications";
import "./src/services/backgroundLocation";
import { hydrateAuthSession } from "./src/store/slices/authSlice";
import { COLORS } from "./src/constants";

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
    initializeNotifications().catch(() => {});
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
