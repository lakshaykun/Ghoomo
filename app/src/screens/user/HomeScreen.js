import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from "../../constants";
import Button from "../../components/common/Button";
import OsmRouteMap from "../../components/map/OsmRouteMap";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const user = useSelector((s) => s.auth.user);
  const activeBooking = useSelector((s) => s.booking.activeBooking);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // Dummy coordinate for Map Preview
  const previewLoc = { lat: 28.6139, lon: 77.209 };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xxl }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.userName}>{user?.name?.split(" ")[0] || "User"}</Text>
            </View>
            <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate("Profile")}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || "U"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Map Preview */}
        <View style={styles.mapPreviewContainer}>
          <View pointerEvents="none" style={styles.mapWrap}>
            <OsmRouteMap pickup={previewLoc} />
          </View>
          <View style={styles.mapOverlay}>
            <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate("RideTypeSelection")} activeOpacity={0.9}>
              <Ionicons name="search" size={20} color={COLORS.primary} />
              <Text style={styles.searchText}>Where to?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary CTA Area */}
        <View style={styles.section}>
          {activeBooking ? (
            <TouchableOpacity onPress={() => navigation.navigate("RideTracking")} style={styles.activeAlert} activeOpacity={0.9}>
              <View style={styles.alertIcon}>
                <Ionicons name="car" size={24} color={COLORS.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>Active Ride</Text>
                <Text style={styles.alertSub}>Tap to track your journey</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.success} />
            </TouchableOpacity>
          ) : (
            <Button
              title="Request a Ride"
              icon={<Ionicons name="car" size={20} color={COLORS.white} />}
              onPress={() => navigation.navigate("RideTypeSelection")}
              size="lg"
            />
          )}
        </View>

        {/* Smart Defaults / Saved Places */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Places</Text>
          <View style={styles.placesList}>
            <TouchableOpacity style={styles.placeItem} onPress={() => navigation.navigate("BookRide", { rideType: "auto", destination: "Home" })}>
              <View style={[styles.placeIcon, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="home" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.placeName}>Home</Text>
                <Text style={styles.placeAddress}>Hostel Block A</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.placeItem} onPress={() => navigation.navigate("BookRide", { rideType: "auto", destination: "Campus" })}>
              <View style={[styles.placeIcon, { backgroundColor: COLORS.grayLight }]}>
                <Ionicons name="school" size={20} color={COLORS.textSecondary} />
              </View>
              <View>
                <Text style={styles.placeName}>Campus</Text>
                <Text style={styles.placeAddress}>Main Gate</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickRow}>
            {[
              { icon: "bus", label: "Bus", screen: "BusBooking", color: COLORS.success },
              { icon: "time", label: "History", screen: "History", color: COLORS.textSecondary },
              { icon: "wallet", label: "Wallet", screen: "Profile", color: COLORS.warning },
            ].map((q) => (
              <TouchableOpacity key={q.label} style={styles.quickBtn} onPress={() => navigation.navigate(q.screen)}>
                <View style={styles.quickIcon}>
                  <Ionicons name={q.icon} size={24} color={q.color} />
                </View>
                <Text style={styles.quickLabel}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { ...TYPOGRAPHY.label, color: COLORS.textSecondary },
  userName: { ...TYPOGRAPHY.title, marginTop: 2 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: COLORS.primary },
  mapPreviewContainer: {
    marginHorizontal: SPACING.lg,
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    ...SHADOWS.soft,
    marginBottom: SPACING.lg,
  },
  mapWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    width: "90%",
    ...SHADOWS.card,
  },
  searchText: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: "600" },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  sectionTitle: { ...TYPOGRAPHY.subtitle, marginBottom: SPACING.md },
  activeAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.success,
    ...SHADOWS.soft,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  alertTitle: { ...TYPOGRAPHY.body, fontWeight: "700", color: COLORS.success },
  alertSub: { ...TYPOGRAPHY.label, marginTop: 2 },
  placesList: { gap: SPACING.md },
  placeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    ...SHADOWS.soft,
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  placeName: { ...TYPOGRAPHY.body, fontWeight: "600" },
  placeAddress: { ...TYPOGRAPHY.label, marginTop: 2 },
  quickRow: { flexDirection: "row", justifyContent: "space-between", gap: SPACING.md },
  quickBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    ...SHADOWS.soft,
  },
  quickIcon: { marginBottom: 8 },
  quickLabel: { ...TYPOGRAPHY.label, fontWeight: "600" },
});
