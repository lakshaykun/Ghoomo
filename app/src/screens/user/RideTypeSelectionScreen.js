import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/common/Header";
import Card from "../../components/common/Card";
import { COLORS, RADIUS, SHADOWS, SPACING } from "../../constants";

const RIDE_OPTIONS = [
  { type: "bike", label: "Bike", icon: "bicycle", color: "#F97316", gradient: ["#F97316", "#FB923C"], desc: "Fast rides for solo travel", eta: "2-4 min" },
  { type: "auto", label: "Auto", icon: "car-sport", color: "#F59E0B", gradient: ["#F59E0B", "#FBBF24"], desc: "Affordable 3-wheeler rides", eta: "3-5 min" },
  { type: "cab", label: "Cab", icon: "car", color: "#2563EB", gradient: ["#2563EB", "#3B82F6"], desc: "More comfort for longer trips", eta: "4-6 min" },
];

export default function RideTypeSelectionScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Choose Vehicle" subtitle="Step 1 of 2" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#EEF4FF", "#F8FAFC"]} style={styles.hero}>
          <Text style={styles.heroEyebrow}>Ride Booking</Text>
          <Text style={styles.heroTitle}>Select your vehicle first.</Text>
          <Text style={styles.heroSub}>
            In the next step, you can enter pickup and destination and confirm the trip.
          </Text>
        </LinearGradient>

        <View style={styles.list}>
          {RIDE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.type}
              activeOpacity={0.92}
              onPress={() => navigation.navigate("BookRide", { rideType: option.type })}
            >
              <Card elevated style={styles.optionCard}>
                <LinearGradient colors={option.gradient} style={styles.optionIcon}>
                  <Ionicons name={option.icon} size={26} color={COLORS.white} />
                </LinearGradient>
                <View style={styles.optionBody}>
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionTitle}>{option.label}</Text>
                    <Text style={styles.optionEta}>{option.eta}</Text>
                  </View>
                  <Text style={styles.optionText}>{option.desc}</Text>
                </View>
                <View style={styles.optionArrow}>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  hero: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  heroEyebrow: { fontSize: 12, fontWeight: "800", color: COLORS.primary, letterSpacing: 0.6, textTransform: "uppercase" },
  heroTitle: { fontSize: 26, fontWeight: "900", color: COLORS.text, marginTop: 10 },
  heroSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, lineHeight: 21, maxWidth: 320 },
  list: { gap: 12 },
  optionCard: { flexDirection: "row", alignItems: "center" },
  optionIcon: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    ...SHADOWS.soft,
  },
  optionBody: { flex: 1 },
  optionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 12 },
  optionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  optionEta: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  optionText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  optionArrow: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginLeft: 12,
  },
});
