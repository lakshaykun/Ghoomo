
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, FARES, RADIUS, SHADOWS, SPACING } from "../../constants";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { fetchSharedRides, joinSharedRideRequest, stopSharedRideRequest } from "../../store/slices/sharedRidesSlice";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;
const serviceCardWidth = isTablet
  ? (width - SPACING.md * 2 - 36) / 4
  : (width - SPACING.md * 2 - 12) / 2;

const SERVICES = [
  { id: "bike", label: "Bike", icon: "bicycle", color: "#FF6B35", gradient: ["#FF6B35", "#FF8C60"], screen: "BookRide", params: { rideType: "bike" } },
  { id: "auto", label: "Auto", icon: "car-sport", color: "#F59E0B", gradient: ["#F59E0B", "#FCD34D"], screen: "BookRide", params: { rideType: "auto" } },
  { id: "cab", label: "Cab", icon: "car", color: "#6C63FF", gradient: ["#6C63FF", "#8B84FF"], screen: "BookRide", params: { rideType: "cab" } },
  { id: "bus", label: "College Bus", icon: "bus", color: "#10B981", gradient: ["#10B981", "#34D399"], screen: "BusBooking", params: {} },
];

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const activeBooking = useSelector(s => s.booking.activeBooking);
  const { myRequests, availableRequests } = useSelector((state) => state.sharedRides);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  useEffect(() => {
    if (!user?.id) return undefined;
    dispatch(fetchSharedRides(user.id)).catch(() => {});
    const intervalId = setInterval(() => {
      dispatch(fetchSharedRides(user.id)).catch(() => {});
    }, 10000);
    return () => clearInterval(intervalId);
  }, [dispatch, user?.id]);

  const handleJoinSharedRide = (requestId) => {
    dispatch(joinSharedRideRequest(requestId, user.id)).catch((error) =>
      Alert.alert("Unable to Join", error.message)
    );
  };

  const handleStopSharedRide = (requestId) => {
    Alert.alert("Stop Shared Request", "This shared ride request will be removed from the list.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Stop",
        style: "destructive",
        onPress: () =>
          dispatch(stopSharedRideRequest(requestId, user.id)).catch((error) =>
            Alert.alert("Unable to Stop", error.message)
          ),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={["#EEF4FF", "#F8FAFC"]} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.userName}>{user?.name?.split(" ")[0]}</Text>
              <Text style={styles.headerSub}>Book rides, buses, and campus travel from one place.</Text>
            </View>
            <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate("Profile")}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate("RideTypeSelection")} activeOpacity={0.9}>
            <Ionicons name="search" size={18} color={COLORS.gray} />
            <Text style={styles.searchText}>Where do you want to go?</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.grayDark} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Active Booking Alert */}
        {activeBooking && (
          <TouchableOpacity onPress={() => navigation.navigate("RideTracking")} style={styles.activeAlert}>
            <LinearGradient colors={[COLORS.success, "#059669"]} style={styles.alertGrad}>
              <Ionicons name="car" size={20} color={COLORS.white} />
              <Text style={styles.alertText}>Active ride in progress • Tap to track</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Book a Ride</Text>
          <View style={styles.servicesGrid}>
            {SERVICES.map(s => (
              <TouchableOpacity key={s.id} style={[styles.serviceCard, { width: serviceCardWidth }]} onPress={() => navigation.navigate(s.screen, s.params)} activeOpacity={0.9}>
                <LinearGradient colors={s.gradient} style={styles.serviceGradient}>
                  <Ionicons name={s.icon} size={28} color={COLORS.white} />
                </LinearGradient>
                <Text style={styles.serviceLabel}>{s.label}</Text>
                {s.id !== "bus" && (
                  <Text style={styles.serviceFare}>₹{FARES[s.id]?.base}+ base</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickRow}>
            {[
              { icon: "time", label: "History", screen: "History", color: COLORS.primary },
              { icon: "wallet", label: "Wallet", screen: "Profile", color: "#10B981" },
              { icon: "star", label: "Favorites", screen: "Profile", color: "#F59E0B" },
              { icon: "help-circle", label: "Support", screen: "Profile", color: "#EF4444" },
            ].map(q => (
              <TouchableOpacity key={q.label} style={styles.quickBtn} onPress={() => navigation.navigate(q.screen)}>
                <View style={[styles.quickIcon, { backgroundColor: q.color + "20" }]}>
                  <Ionicons name={q.icon} size={22} color={q.color} />
                </View>
                <Text style={styles.quickLabel}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Promo Banner */}
        <View style={styles.section}>
          <LinearGradient colors={["#1D4ED8", "#0EA5E9"]} style={styles.promoBanner}>
            <View>
              <Text style={styles.promoTitle}>Share & Save!</Text>
              <Text style={styles.promoSub}>Share cab/auto rides and save up to 40%</Text>
            </View>
            <Ionicons name="people" size={48} color="rgba(255,255,255,0.4)" />
          </LinearGradient>
        </View>

        {(myRequests.length > 0 || availableRequests.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shared Ride Requests</Text>
            {myRequests.map((request) => (
              <Card key={request.id} elevated style={styles.sharedCard}>
                <View style={styles.sharedHeader}>
                  <View style={styles.sharedBadge}>
                    <Ionicons name="people" size={18} color={COLORS.success} />
                  </View>
                  <View style={styles.sharedInfo}>
                    <Text style={styles.sharedTitle}>Your shared {request.rideType}</Text>
                    <Text style={styles.sharedRoute} numberOfLines={2}>{request.pickup?.name} to {request.drop?.name}</Text>
                  </View>
                </View>
                <Text style={styles.sharedMeta}>
                  {request.acceptedCount}/{request.requestedSeats} joined • {request.remainingSeats} seat{request.remainingSeats === 1 ? "" : "s"} left
                </Text>
                <Button title="Stop Request" onPress={() => handleStopSharedRide(request.id)} variant="danger" variant2="outline" />
              </Card>
            ))}

            {availableRequests.map((request) => (
              <Card key={request.id} elevated style={styles.sharedCard}>
                <View style={styles.sharedHeader}>
                  <View style={[styles.sharedBadge, { backgroundColor: COLORS.primary + "15" }]}>
                    <Ionicons name="people-circle" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.sharedInfo}>
                    <Text style={styles.sharedTitle}>{request.ownerName}'s shared {request.rideType}</Text>
                    <Text style={styles.sharedRoute} numberOfLines={2}>{request.pickup?.name} to {request.drop?.name}</Text>
                  </View>
                </View>
                <Text style={styles.sharedMeta}>
                  {request.remainingSeats} seat{request.remainingSeats === 1 ? "" : "s"} available • {request.acceptedCount} joined
                </Text>
                <Button
                  title="Accept Shared Request"
                  onPress={() => handleJoinSharedRide(request.id)}
                  variant="success"
                  disabled={Boolean(activeBooking)}
                />
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.xl },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SPACING.md },
  greeting: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "700" },
  userName: { fontSize: 28, fontWeight: "900", color: COLORS.text },
  headerSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6, maxWidth: 260, lineHeight: 20 },
  profileBtn: {},
  avatar: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  avatarText: { fontSize: 18, fontWeight: "900", color: COLORS.primary },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  searchText: { flex: 1, fontSize: 15, color: COLORS.grayDark, fontWeight: "500" },
  activeAlert: { margin: SPACING.md, borderRadius: RADIUS.md, overflow: "hidden" },
  alertGrad: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  alertText: { flex: 1, color: COLORS.white, fontWeight: "700", fontSize: 14 },
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.md },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  serviceCard: {
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  serviceGradient: { width: 62, height: 62, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  serviceLabel: { fontSize: 14, fontWeight: "800", color: COLORS.text, textAlign: "left" },
  serviceFare: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, fontWeight: "600" },
  quickRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  quickBtn: {
    alignItems: "center",
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  quickIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  quickLabel: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  promoBanner: { borderRadius: RADIUS.lg, padding: SPACING.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center", ...SHADOWS.soft },
  promoTitle: { fontSize: 20, fontWeight: "800", color: COLORS.white, marginBottom: 4 },
  promoSub: { fontSize: 13, color: "rgba(255,255,255,0.85)", maxWidth: 180 },
  sharedCard: { marginBottom: SPACING.sm },
  sharedHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  sharedBadge: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.success + "15" },
  sharedInfo: { flex: 1 },
  sharedTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  sharedRoute: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  sharedMeta: { fontSize: 12, fontWeight: "700", color: COLORS.primary, marginBottom: 12 },
});
