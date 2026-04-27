import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants";

const { width } = Dimensions.get("window");

export default function SplashScreen({ navigation }) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    const checkOnboarding = async () => {
      try {
        const hasOnboarded = await AsyncStorage.getItem("has_onboarded");
        if (hasOnboarded) {
          navigation.replace("Login");
        } else {
          navigation.replace("Onboarding");
        }
      } catch (e) {
        navigation.replace("Login");
      }
    };

    const timer = setTimeout(() => {
      checkOnboarding();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <View style={styles.iconCircle}>
          <Ionicons name="car" size={52} color={COLORS.primary} />
        </View>
        <Animated.Text style={[styles.appName, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
          Ghoomo
        </Animated.Text>
        <Animated.Text style={[styles.tagline, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
          Your Ride, Your Way
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary },
  logoWrap: { alignItems: "center" },
  iconCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center", marginBottom: 24, shadowColor: COLORS.text, shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  appName: { fontSize: 48, fontWeight: "900", color: COLORS.surface, letterSpacing: 2 },
  tagline: { fontSize: 16, color: "rgba(255,255,255,0.8)", marginTop: 8, letterSpacing: 1 },
});
