
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import DriverHomeScreen from "../screens/driver/DriverHomeScreen";
import BusDriverScreen from "../screens/driver/BusDriverScreen";

const Stack = createNativeStackNavigator();

export default function DriverNavigator() {
  const user = useSelector(s => s.auth.user);
  const isBusDriver = user?.vehicleType === "bus";

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isBusDriver ? (
        <Stack.Screen name="BusDriver" component={BusDriverScreen} />
      ) : (
        <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
      )}
    </Stack.Navigator>
  );
}
