import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../constants";
import Button from "../../components/common/Button";
import * as Location from "expo-location";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Request a Ride",
    description: "Easily book bikes, autos, cabs, or campus buses with just a few taps.",
    icon: "car-sport-outline",
  },
  {
    id: "2",
    title: "Track in Real-Time",
    description: "Know exactly where your driver is and share your live ETA with friends.",
    icon: "map-outline",
  },
  {
    id: "3",
    title: "Location Access",
    description: "We need your location to find nearby rides and track your journey.",
    icon: "location-outline",
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = async () => {
    if (currentIndex === SLIDES.length - 1) {
      await requestLocationAndFinish();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const requestLocationAndFinish = async () => {
    try {
      await Location.requestForegroundPermissionsAsync();
      await AsyncStorage.setItem("has_onboarded", "true");
      navigation.replace("Login");
    } catch (e) {
      console.warn("Error requesting location permission", e);
      await AsyncStorage.setItem("has_onboarded", "true");
      navigation.replace("Login");
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("has_onboarded", "true");
    navigation.replace("Login");
  };

  const slide = SLIDES[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {currentIndex < SLIDES.length - 1 ? (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name={slide.icon} size={80} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <Button
          title={currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
          size="lg"
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    height: 50,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: SPACING.lg,
  },
  skipText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontWeight: "600" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  title: { ...TYPOGRAPHY.title, textAlign: "center", marginBottom: SPACING.md },
  description: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: "center", lineHeight: 24 },
  footer: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  dots: { flexDirection: "row", justifyContent: "center", marginBottom: SPACING.xl, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.borderStrong },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
  btn: { width: "100%" },
});
