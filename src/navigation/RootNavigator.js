
import React from "react";
import { useSelector } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./AuthNavigator";
import UserNavigator from "./UserNavigator";
import DriverNavigator from "./DriverNavigator";
import AdminNavigator from "./AdminNavigator";

export default function RootNavigator() {
  const { isAuthenticated, user } = useSelector(s => s.auth);

  const getNavigator = () => {
    if (!isAuthenticated) return <AuthNavigator />;
    switch (user?.role) {
      case "driver": return <DriverNavigator />;
      case "admin": return <AdminNavigator />;
      default: return <UserNavigator />;
    }
  };

  return (
    <NavigationContainer>
      {getNavigator()}
    </NavigationContainer>
  );
}
