
import React from "react";
import { useSelector } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./AuthNavigator";
import UserNavigator from "./UserNavigator";
import DriverNavigator from "./DriverNavigator";

export default function RootNavigator() {
  const isAuthenticated = useSelector(s => s.auth.isAuthenticated);
  const role = useSelector(s => s.auth.user?.role);
  const user = useSelector(s => s.auth.user);

  React.useEffect(() => {
    console.log("[RootNavigator] Auth state changed:", {
      isAuthenticated,
      role,
      hasUser: !!user,
      userId: user?.id
    });
  }, [isAuthenticated, role, user]);

  const getNavigator = () => {
    if (!isAuthenticated) {
      console.log("[RootNavigator] Rendering AuthNavigator");
      return <AuthNavigator />;
    }
    switch (role) {
      case "driver":
      case "bus_driver":
        console.log("[RootNavigator] Rendering DriverNavigator");
        return <DriverNavigator />;
      default:
        console.log("[RootNavigator] Rendering UserNavigator");
        return <UserNavigator />;
    }
  };

  return (
    <NavigationContainer>
      {getNavigator()}
    </NavigationContainer>
  );
}
