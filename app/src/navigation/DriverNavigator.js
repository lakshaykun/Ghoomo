import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { Platform } from "react-native";
import DriverHomeScreen from "../screens/driver/DriverHomeScreen";
import BusDriverScreen from "../screens/driver/BusDriverScreen";
import BusDriverRouteScreen from "../screens/driver/BusDriverRouteScreen";
import DriverHistoryScreen from "../screens/driver/DriverHistoryScreen";
import DriverProfileScreen from "../screens/driver/DriverProfileScreen";
import DriverOtpScreen from "../screens/driver/DriverOtpScreen";
import ScheduledRequestsScreen from "../screens/driver/ScheduledRequestsScreen";
import { COLORS, TYPOGRAPHY, SHADOWS } from "../constants";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 85 : 65,
          paddingBottom: Platform.OS === "ios" ? 25 : 8,
          paddingTop: 8,
          ...SHADOWS.card,
        },
        tabBarLabelStyle: { ...TYPOGRAPHY.caption, fontWeight: "700", marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="DriverHomeTab"
        component={DriverHomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="car-sport" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="DriverHistory"
        component={DriverHistoryScreen}
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="ScheduledRequests"
        component={ScheduledRequestsScreen}
        options={{
          title: "Scheduled",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function DriverNavigator() {
  const user = useSelector(s => s.auth.user);
  const isBusDriver = user?.role === "bus_driver" || user?.vehicleType === "bus" || Boolean(user?.busRoute);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isBusDriver ? (
        <>
          <Stack.Screen name="BusDriver" component={BusDriverScreen} />
          <Stack.Screen name="BusDriverRoute" component={BusDriverRouteScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="DriverTabs" component={DriverTabs} />
          <Stack.Screen name="DriverOtp" component={DriverOtpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
