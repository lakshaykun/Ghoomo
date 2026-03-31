
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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

    // Keep splash snappy; auth hydration happens in background.
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.primaryDark, "#3B2FB5"]} style={styles.container}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <View style={styles.iconCircle}>
          <Ionicons name="car" size={52} color={COLORS.white} />
        </View>
        <Animated.Text style={[styles.appName, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
          Ghoomo
        </Animated.Text>
        <Animated.Text style={[styles.tagline, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
          Your Ride, Your Way
        </Animated.Text>
      </Animated.View>
      <Animated.View style={[styles.bottom, { opacity: opacityAnim }]}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoWrap: { alignItems: "center" },
  iconCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 24, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  appName: { fontSize: 48, fontWeight: "900", color: COLORS.white, letterSpacing: 2 },
  tagline: { fontSize: 16, color: "rgba(255,255,255,0.8)", marginTop: 8, letterSpacing: 1 },
  bottom: { position: "absolute", bottom: 60, flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { width: 24, backgroundColor: COLORS.white },
});
