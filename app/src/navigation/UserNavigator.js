import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Platform } from "react-native";
import { COLORS, TYPOGRAPHY, SHADOWS } from "../constants";

import HomeScreen from "../screens/user/HomeScreen";
import BookRideScreen from "../screens/user/BookRideScreen";
import BusModuleScreen from "../screens/user/BusModuleScreen";
import BusBookingFlowScreen from "../screens/user/BusBookingFlowScreen";
import BusLiveTrackingScreen from "../screens/user/BusLiveTrackingScreen";
import RideTrackingScreen from "../screens/user/RideTrackingScreen";
import RideHistoryScreen from "../screens/user/RideHistoryScreen";
import ProfileScreen from "../screens/user/ProfileScreen";
import SharedRidesScreen from "../screens/user/SharedRidesScreen";
import SavedLocationsScreen from "../screens/user/SavedLocationsScreen";
import RideHistoryDetailScreen from "../screens/user/RideHistoryDetailScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserHome" component={HomeScreen} />
      <Stack.Screen name="BookRide" component={BookRideScreen} />
      <Stack.Screen name="BusBooking" component={BusModuleScreen} />
      <Stack.Screen name="BusBookingFlow" component={BusBookingFlowScreen} />
      <Stack.Screen name="BusLiveTracking" component={BusLiveTrackingScreen} />
      <Stack.Screen name="RideTracking" component={RideTrackingScreen} />
      <Stack.Screen name="SavedLocations" component={SavedLocationsScreen} />
      <Stack.Screen name="RideHistoryDetail" component={RideHistoryDetailScreen} />
    </Stack.Navigator>
  );
}

export default function UserNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home: focused ? "home" : "home-outline",
            Shared: focused ? "people" : "people-outline",
            History: focused ? "time" : "time-outline",
            Profile: focused ? "person" : "person-outline",
          };
          return <Ionicons name={icons[route.name]} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack} 
        options={({ route }) => ({
          tabBarStyle: ((route) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? "UserHome";
            if (["BusBooking", "BusBookingFlow", "BusLiveTracking"].includes(routeName)) {
              return { display: "none" };
            }
            return styles.tabBar;
          })(route),
        })}
      />
      <Tab.Screen name="Shared" component={SharedRidesScreen} />
      <Tab.Screen name="History" component={RideHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 0,
    height: Platform.OS === "ios" ? 85 : 65,
    paddingBottom: Platform.OS === "ios" ? 25 : 8,
    paddingTop: 8,
    ...SHADOWS.card,
  },
  tabLabel: { ...TYPOGRAPHY.caption, fontWeight: "700", marginTop: 2 },
});
