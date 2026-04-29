import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, View } from "react-native";
import { COLORS, TYPOGRAPHY, SHADOWS } from "../../constants";

import BusBookTab from "./BusBookTab";
import BusTrackTab from "./BusTrackTab";
import BusHistoryScreen from "./BusHistoryScreen";

const Tab = createBottomTabNavigator();

export default function BusModuleScreen() {
  return (
    <Tab.Navigator
      initialRouteName="Book Bus"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Book Bus") {
            iconName = focused ? "bus" : "bus-outline";
          } else if (route.name === "Track Bus") {
            iconName = focused ? "map" : "map-outline";
          } else if (route.name === "History") {
            iconName = focused ? "time" : "time-outline";
          }
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={View} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("UserHome");
          },
        })}
      />
      <Tab.Screen name="Book Bus" component={BusBookTab} />
      <Tab.Screen name="Track Bus" component={BusTrackTab} />
      <Tab.Screen name="History" component={BusHistoryScreen} />
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
