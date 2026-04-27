import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { createRideBooking, fetchRideQuote } from "../../store/slices/bookingSlice";
import Header from "../../components/common/Header";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Skeleton from "../../components/common/Skeleton";
import OsmRouteMap from "../../components/map/OsmRouteMap";
import LocationPicker from "../../components/map/LocationPicker";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, FARES, SHADOWS } from "../../constants";

const RIDE_OPTIONS = [
  { type: "bike",  label: "Bike", icon: "bicycle",   color: "#FF6B35", desc: "Fast & affordable",       shareable: false },
  { type: "auto",  label: "Auto", icon: "car-sport",  color: "#F59E0B", desc: "Comfortable 3-wheeler",  shareable: true },
  { type: "cab",   label: "Cab",  icon: "car",         color: "#6C63FF", desc: "AC cab, premium ride",  shareable: true },
];

const PAYMENT_OPTIONS = [
  { key: "cash",   label: "Cash",   icon: "cash" },
  { key: "upi",    label: "UPI",    icon: "phone-portrait" },
  { key: "card",   label: "Card",   icon: "card" },
  { key: "wallet", label: "Wallet", icon: "wallet" },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function BookRideScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { currentQuote, loading } = useSelector((s) => s.booking);

  const {
    rideType: initType  = "cab",
    presetPickup        = null,
    presetDrop          = null,
    destination         = null,
  } = route.params || {};

  // ── Wizard step ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1); // 1: pick locations, 2: confirm, 3: searching

  // ── Location state (lifted from LocationPicker) ────────────────────────────
  const [pickupPlace, setPickupPlace] = useState(presetPickup || null);
  const [dropPlace, setDropPlace]     = useState(presetDrop   || null);

  // ── Ride options ───────────────────────────────────────────────────────────
  const [selectedType,      setSelectedType]      = useState(initType);
  const [isShare,           setIsShare]           = useState(false);
  const [sharedSeatsWanted, setSharedSeatsWanted] = useState(1);
  const [paymentMethod,     setPaymentMethod]     = useState("cash");

  const currentRide   = RIDE_OPTIONS.find((r) => r.type === selectedType) || RIDE_OPTIONS[2];
  const fareKey       = isShare && currentRide?.shareable ? selectedType + "Share" : selectedType;
  const fareInfo      = FARES[fareKey] || FARES[selectedType];
  const estimate      = currentQuote?.estimate;
  const availability  = currentQuote?.availability;
  const hasAvailableDriver = Boolean(availability?.available);
  const estDist = estimate?.distanceKm || 0;
  const estFare = estimate?.fare || fareInfo?.base || 0;

  // ── Fetch quote when both locations are set ─────────────────────────────────
  useEffect(() => {
    if (!pickupPlace || !dropPlace) return;
    dispatch(fetchRideQuote({
      rideType: selectedType,
      isShare: isShare && currentRide?.shareable,
      pickup: pickupPlace,
      drop: dropPlace,
      scheduledAt: null,
    })).catch(() => {});
  }, [pickupPlace, dropPlace, selectedType, isShare]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNextStep = () => {
    if (!pickupPlace || !dropPlace) {
      Alert.alert("Missing Info", "Please set both pickup and drop locations.");
      return;
    }
    setStep(2);
  };

  const handleBook = () => {
    if (!hasAvailableDriver) {
      Alert.alert("No Driver Available", availability?.message || "No nearby driver found.");
      return;
    }
    setStep(3);
    dispatch(createRideBooking({
      rideType: selectedType,
      pickup: pickupPlace,
      drop: dropPlace,
      userId: user.id,
      isShare: isShare && currentRide?.shareable,
      sharedSeatsWanted: isShare && currentRide?.shareable ? sharedSeatsWanted : 0,
      paymentMethod,
    }))
      .then(() => navigation.navigate("RideTracking"))
      .catch((err) => {
        Alert.alert("Booking Failed", err.message || "Unable to create ride.");
        setStep(2);
      });
  };

  // ── Step 3 — Searching ─────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <SafeAreaView style={styles.searchingSafe}>
        <View style={styles.searchingContent}>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: SPACING.xl }} />
          <Text style={styles.searchingTitle}>Finding your ride…</Text>
          <Text style={styles.searchingSub}>Contacting nearby {currentRide.label} drivers</Text>
        </View>
        <Button
          title="Cancel Search"
          variant="secondary"
          onPress={() => setStep(2)}
          style={styles.cancelBtn}
        />
      </SafeAreaView>
    );
  }

  // ── Step 1 — Location picker ───────────────────────────────────────────────
  if (step === 1) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Header
          title="Select Locations"
          onBack={() => navigation.goBack()}
        />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <LocationPicker
            initialPickup={pickupPlace}
            initialDrop={dropPlace}
            onPickupChange={setPickupPlace}
            onDropChange={setDropPlace}
            style={{ flex: 1 }}
          />
          {/* CTA — only active when both locations are filled */}
          <View style={styles.bottomBar}>
            <Button
              title={pickupPlace && dropPlace ? "Next: Confirm Ride →" : "Set pickup & drop to continue"}
              onPress={handleNextStep}
              disabled={!pickupPlace || !dropPlace}
              size="lg"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Step 2 — Confirm ride ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header
        title="Confirm Ride"
        onBack={() => setStep(1)}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Route map preview */}
          <View style={styles.mapPreview}>
            <OsmRouteMap pickup={pickupPlace} drop={dropPlace} />
          </View>

          {/* Locations summary */}
          <View style={styles.section}>
            <Card>
              <View style={styles.locationRow}>
                <View style={[styles.locationDot, { backgroundColor: COLORS.success }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationName} numberOfLines={2}>
                    {pickupPlace?.name || pickupPlace?.address || "—"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.locationSep} />
              <View style={styles.locationRow}>
                <View style={[styles.locationDot, { backgroundColor: COLORS.error }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationLabel}>Drop</Text>
                  <Text style={styles.locationName} numberOfLines={2}>
                    {dropPlace?.name || dropPlace?.address || "—"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </Card>
          </View>

          {/* Ride type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ride Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md }}>
              {RIDE_OPTIONS.map((ride) => (
                <TouchableOpacity
                  key={ride.type}
                  style={[styles.rideCard, selectedType === ride.type && styles.rideCardActive]}
                  onPress={() => setSelectedType(ride.type)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={ride.icon} size={28} color={selectedType === ride.type ? COLORS.primary : COLORS.grayDark} />
                  <Text style={[styles.rideLabel, selectedType === ride.type && styles.rideLabelActive]}>{ride.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Payment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <Card>
              <View style={styles.choiceRow}>
                {PAYMENT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.chip, paymentMethod === opt.key && styles.chipActive]}
                    onPress={() => setPaymentMethod(opt.key)}
                  >
                    <Ionicons name={opt.icon} size={16} color={paymentMethod === opt.key ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.chipText, paymentMethod === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          </View>

          {/* Fare estimate */}
          <View style={styles.section}>
            <Card>
              <Text style={styles.fareSummaryTitle}>Estimate</Text>
              {loading && !currentQuote ? (
                <Skeleton width="100%" height={24} style={{ marginTop: 8 }} />
              ) : (
                <>
                  <View style={styles.fareRow}>
                    <Text style={styles.fareKey}>Total Distance</Text>
                    <Text style={styles.fareVal}>{estDist || "—"} km</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.fareRow}>
                    <Text style={styles.fareTotalKey}>Estimated Fare</Text>
                    <Text style={styles.fareTotalVal}>₹{estFare}</Text>
                  </View>
                  {!hasAvailableDriver && availability?.message && (
                    <Text style={styles.errorText}>{availability.message}</Text>
                  )}
                </>
              )}
            </Card>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <Button
            title={loading ? "Calculating…" : `Confirm & Book • ₹${estFare}`}
            onPress={handleBook}
            disabled={loading || !hasAvailableDriver}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:                { flex: 1, backgroundColor: COLORS.background },
  scroll:              { flex: 1 },
  searchingSafe:       { flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" },
  searchingContent:    { alignItems: "center" },
  searchingTitle:      { ...TYPOGRAPHY.title, color: COLORS.text, marginBottom: 8 },
  searchingSub:        { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  cancelBtn:           { position: "absolute", bottom: SPACING.xxl, width: "90%" },

  section:             { paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  sectionTitle:        { ...TYPOGRAPHY.subtitle, marginBottom: SPACING.sm },

  mapPreview:          { height: 200, marginHorizontal: SPACING.lg, marginTop: SPACING.lg, borderRadius: RADIUS.lg, overflow: "hidden" },

  // Locations summary
  locationRow:         { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md },
  locationDot:         { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  locationLabel:       { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginBottom: 2 },
  locationName:        { ...TYPOGRAPHY.body, fontWeight: "600", color: COLORS.text },
  locationSep:         { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },

  // Ride cards
  rideCard: {
    width: 100, height: 100,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
    ...SHADOWS.soft,
  },
  rideCardActive:     { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + "30" },
  rideLabel:          { ...TYPOGRAPHY.label, marginTop: 8 },
  rideLabelActive:    { color: COLORS.primary, fontWeight: "700" },

  // Payment chips
  choiceRow:          { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  chipActive:         { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + "30" },
  chipText:           { ...TYPOGRAPHY.label },
  chipTextActive:     { color: COLORS.primary, fontWeight: "700" },

  // Fare
  fareSummaryTitle:   { ...TYPOGRAPHY.subtitle, marginBottom: SPACING.md },
  fareRow:            { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  fareKey:            { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  fareVal:            { ...TYPOGRAPHY.body, fontWeight: "600" },
  divider:            { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  fareTotalKey:       { ...TYPOGRAPHY.body, fontWeight: "800" },
  fareTotalVal:       { ...TYPOGRAPHY.title, color: COLORS.primary },
  errorText:          { ...TYPOGRAPHY.label, color: COLORS.error, marginTop: SPACING.md, fontWeight: "600" },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    ...SHADOWS.card,
  },
});
