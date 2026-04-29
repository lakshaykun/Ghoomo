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
  TextInput,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { createRideBooking, fetchRideQuote, setActiveBooking } from "../../store/slices/bookingSlice";
import Header from "../../components/common/Header";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Skeleton from "../../components/common/Skeleton";
import OsmRouteMap from "../../components/map/OsmRouteMap";
import LocationPicker from "../../components/map/LocationPicker";
import { fetchOSRMRoute } from "../../utils/map";
import { subscribeGlobalRealtime } from "../../services/realtime";
import { api } from "../../services/api";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from "../../constants";

const RIDE_OPTIONS = [
  { type: "bike", label: "Bike", icon: "bicycle", color: "#FF6B35", desc: "Fast & affordable", shareable: false },
  { type: "auto", label: "Auto", icon: "car-sport", color: "#F59E0B", desc: "Comfortable 3-wheeler", shareable: true },
  { type: "cab", label: "Cab", icon: "car", color: "#6C63FF", desc: "AC cab, premium ride", shareable: true },
];

const PAYMENT_OPTIONS = [
  { key: "cash", label: "Cash", icon: "cash" },
  { key: "upi", label: "UPI", icon: "phone-portrait" },
  { key: "card", label: "Card", icon: "card" },
  { key: "wallet", label: "Wallet", icon: "wallet" },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function BookRideScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const authToken = useSelector((s) => s.auth.token || s.auth.accessToken || null);
  const { currentQuote, loading } = useSelector((s) => s.booking);

  const {
    rideType: initType = "cab",
    presetPickup = null,
    presetDrop = null,
    destination = null,
  } = route.params || {};

  // ── Wizard step ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1); // 1: pick locations, 2: confirm, 3: searching
  const activeRequestRef = useRef(null);  // the ride_request row returned from booking
  const wsUnsubRef = useRef(null);
  const timeoutRef = useRef(null);

  // ── Location state (lifted from LocationPicker) ────────────────────────────
  const [pickupPlace, setPickupPlace] = useState(presetPickup || null);
  const [dropPlace, setDropPlace] = useState(presetDrop || null);
  const [fetchedRoutePoints, setFetchedRoutePoints] = useState([]);

  // ── Ride options ───────────────────────────────────────────────────────────
  const [selectedType, setSelectedType] = useState(initType);
  const [isShare, setIsShare] = useState(false);
  const [sharedSeatsWanted, setSharedSeatsWanted] = useState(1);
  const [minVehicleCapacityAllowed, setMinVehicleCapacityAllowed] = useState(4);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(new Date(Date.now() + 30 * 60000)); // Default 30 mins from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const currentRide = RIDE_OPTIONS.find((r) => r.type === selectedType) || RIDE_OPTIONS[2];
  const estimate = currentQuote?.estimate;
  const availability = currentQuote?.availability;
  const hasAvailableDriver = Boolean(availability?.available);
  const estDist = estimate?.distanceKm || 0;
  const estFare = estimate?.fare ?? 0;

  const routePointsData = fetchedRoutePoints.length > 0
    ? fetchedRoutePoints
    : Array.isArray(currentQuote?.route)
      ? currentQuote.route
      : (currentQuote?.route?.geometry?.coordinates || currentQuote?.route?.geometry || []);

  // ── Fetch quote when both locations are set ─────────────────────────────────
  useEffect(() => {
    if (!pickupPlace || !dropPlace) {
      setFetchedRoutePoints([]);
      return;
    }

    const pLat = pickupPlace.latitude;
    const pLon = pickupPlace.longitude;
    const dLat = dropPlace.latitude;
    const dLon = dropPlace.longitude;

    // Only proceed if we have actual valid numeric coordinates
    if (!Number.isFinite(pLat) || !Number.isFinite(pLon) || !Number.isFinite(dLat) || !Number.isFinite(dLon)) {
      console.warn("[BookRideScreen] Invalid coordinates for route/quote fetch");
      return;
    }

    // Fetch OSRM route for visual path
    fetchOSRMRoute(pickupPlace, dropPlace)
      .then(points => {
        setFetchedRoutePoints(Array.isArray(points) ? points : []);
      })
      .catch(err => {
        console.warn("[BookRideScreen] OSRM fetch error:", err);
        setFetchedRoutePoints([]);
      });

    dispatch(fetchRideQuote({
      rideType: selectedType,
      isShare: isShare && (currentRide?.shareable ?? true),
      pickup: pickupPlace,
      drop: dropPlace,
      scheduledAt: null,
    })).catch((err) => {
      console.warn("[BookRideScreen] fetchRideQuote error:", err);
    });
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
    setStep(3);

    // Clear any existing timeout/subscription just in case
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    wsUnsubRef.current?.();

    dispatch(createRideBooking({
      rideType: selectedType,
      pickup: pickupPlace,
      drop: dropPlace,
      userId: user.id,
      isShare: isShare && currentRide?.shareable,
      sharedSeatsWanted: isShare && currentRide?.shareable ? sharedSeatsWanted : 1,
      minVehicleCapacityAllowed: isShare && currentRide?.shareable ? minVehicleCapacityAllowed : null,
      isScheduled,
      scheduledAt: isScheduled ? scheduledAt.toISOString() : null,
      paymentMethod,
    }))
      .then((rideRequest) => {
        activeRequestRef.current = rideRequest;

        // If ride is already accepted (e.g. backend auto-assigned), go to tracking immediately
        const status = String(rideRequest.status || "").toUpperCase();
        if (["ACCEPTED", "ASSIGNED", "ARRIVING", "STARTED", "DRIVER_ARRIVED", "ON_TRIP"].includes(status)) {
          console.log(`[BookRideScreen] Ride already active: status=${status}, navigating to tracking.`);
          dispatch(setActiveBooking(rideRequest));
          navigation.navigate("RideTracking");
          return;
        }

        // If it's a scheduled ride, we don't wait for a driver.
        // It's already created and visible to others/drivers.
        if (isScheduled) {
          Alert.alert(
            "Ride Scheduled",
            isShare 
              ? "Your shared ride request has been posted. Others can now join!"
              : "Your ride has been scheduled. Drivers will notify you once they accept.",
            [{ text: "OK", onPress: () => {
              if (isShare) {
                navigation.navigate("SharedRides");
              } else {
                navigation.navigate("Home");
              }
            }}]
          );
          return;
        }

        // ── 1. Schedule 5-minute timeout fallback FIRST ──
        // This avoids race conditions where the "ride_accepted" event arrives 
        // before the timeout is assigned to the ref.
        timeoutRef.current = setTimeout(() => {
          wsUnsubRef.current?.();
          timeoutRef.current = null;
          Alert.alert(
            "No Driver Found",
            "No driver accepted within 5 minutes. Please try again.",
            [{ text: "OK", onPress: () => setStep(2) }]
          );
        }, 300000);

        // ── 2. Start WebSocket listener for driver acceptance ──
        const unsubscribe = subscribeGlobalRealtime(authToken, {
          onEvent: (event, data) => {
            console.log(`[BookRideScreen] Event received: ${event}`, data);
            if (event === "ride_accepted" && data?.ride) {
              const ride = data.ride;
              // Only react if this is for our request
              if (
                ride.request_id === rideRequest?.id ||
                ride.requestId === rideRequest?.id ||
                ride.id === rideRequest?.id
              ) {
                console.log("[BookRideScreen] Ride accepted! Clearing timeout and navigating.");
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
                wsUnsubRef.current?.();
                wsUnsubRef.current = null;
                dispatch(setActiveBooking(ride));
                navigation.navigate("RideTracking");
              }
            }
            if (event === "ride_status_updated" && data?.status === "cancelled") {
              if (data.rideId === rideRequest?.id || data.id === rideRequest?.id) {
                console.log("[BookRideScreen] Ride cancelled by backend (no drivers).");
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
                wsUnsubRef.current?.();
                wsUnsubRef.current = null;
                Alert.alert(
                  "No Driver Available",
                  data.reason === "NO_DRIVERS_AVAILABLE"
                    ? "Sorry, all nearby drivers are currently busy. Please try again in a few minutes."
                    : "Your ride request was cancelled.",
                  [{ text: "OK", onPress: () => setStep(2) }]
                );
              }
            }
          },
        });
        wsUnsubRef.current = unsubscribe;
      })
      .catch((err) => {
        console.error("[BookRideScreen] Booking error:", err);
        Alert.alert("Booking Failed", err.message || "Unable to create ride.");
        setStep(2);
      });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsUnsubRef.current?.();
      clearTimeout(timeoutRef.current);
    };
  }, []);

  // ── Step 3 — Searching ─────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <SafeAreaView style={styles.searchingSafe}>
        <View style={styles.searchingHeader}>
          <TouchableOpacity onPress={() => setStep(2)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Finding your ride</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.searchingContent}>
          <View style={styles.lottiePlaceholder}>
            <View style={styles.pulseCircle} />
            <View style={[styles.pulseCircle, { transform: [{ scale: 1.5 }], opacity: 0.3 }]} />
            <Ionicons name="car-sport" size={60} color={COLORS.primary} />
          </View>

          <Text style={styles.searchingTitle}>Searching for {selectedType}s…</Text>
          <Text style={styles.searchingSub}>Connecting you with nearby professional drivers. This usually takes less than a minute.</Text>

          <Card style={styles.tipCard}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.tipText}>Tip: Your driver will ask for a 4-digit OTP to start the trip once they arrive.</Text>
          </Card>
        </View>

        <View style={styles.bottomBar}>
          <Button
            title="Cancel Request"
            variant="secondary"
            onPress={() => {
              if (activeRequestRef.current?.id) {
                api.cancelRequest(activeRequestRef.current.id).catch(() => { });
              }
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              wsUnsubRef.current?.();
              wsUnsubRef.current = null;
              setStep(2);
            }}
            size="lg"
          />
        </View>
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
        <LocationPicker
          initialPickup={pickupPlace}
          initialDrop={dropPlace}
          onPickupChange={setPickupPlace}
          onDropChange={setDropPlace}
          distance={estDist}
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Route map preview */}
          <View style={styles.mapPreview}>
            <OsmRouteMap pickup={pickupPlace} drop={dropPlace} routePoints={routePointsData} />
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
            <View style={{ gap: SPACING.md }}>
              {RIDE_OPTIONS.map((ride) => {
                const price = selectedType === ride.type ? (estimate?.fare ?? "—") : "—";
                return (
                  <TouchableOpacity
                    key={ride.type}
                    style={[styles.rideOptionRow, selectedType === ride.type && styles.rideOptionRowActive]}
                    onPress={() => setSelectedType(ride.type)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.rideOptionIconWrap, selectedType === ride.type && { backgroundColor: COLORS.primaryLight + "30" }]}>
                      <Ionicons name={ride.icon} size={28} color={selectedType === ride.type ? COLORS.primary : COLORS.grayDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rideOptionLabel, selectedType === ride.type && styles.rideOptionLabelActive]}>{ride.label}</Text>
                      <Text style={styles.rideOptionDesc}>{ride.desc}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[styles.rideOptionPrice, selectedType === ride.type && { color: COLORS.primary }]}>
                        {price !== "—" ? `₹${Number(price).toFixed(2)}` : price}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Payment & Sharing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Options</Text>
            <Card>
              <Text style={styles.optionSubTitle}>Payment Method</Text>
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

              {currentRide.shareable && (
                <>
                  <View style={styles.optionSep} />
                  <TouchableOpacity
                    style={styles.shareToggleRow}
                    onPress={() => {
                      const nextValue = !isShare;
                      setIsShare(nextValue);
                      if (nextValue) {
                        setIsScheduled(true); // Shared rides must be scheduled
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.shareToggleInfo}>
                      <Text style={styles.shareToggleTitle}>Share this ride</Text>
                      <Text style={styles.shareToggleDesc}>Allow others to join (Requires scheduling)</Text>
                    </View>
                    <View style={[styles.toggleOuter, isShare && styles.toggleOuterActive]}>
                      <View style={[styles.toggleInner, isShare && styles.toggleInnerActive]} />
                    </View>
                  </TouchableOpacity>

                  {isShare && (
                    <View style={{ marginTop: SPACING.md }}>
                      <Text style={styles.optionSubTitle}>Your Passengers</Text>
                      <View style={styles.counterRow}>
                        <TouchableOpacity style={styles.counterBtn} onPress={() => setSharedSeatsWanted(Math.max(1, sharedSeatsWanted - 1))}>
                          <Ionicons name="remove" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.counterText}>{sharedSeatsWanted}</Text>
                        <TouchableOpacity style={styles.counterBtn} onPress={() => setSharedSeatsWanted(Math.min(6, sharedSeatsWanted + 1))}>
                          <Ionicons name="add" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                      </View>

                      <Text style={[styles.optionSubTitle, { marginTop: SPACING.md }]}>Require Vehicle Minimum Seats</Text>
                      <View style={styles.counterRow}>
                        <TouchableOpacity style={styles.counterBtn} onPress={() => setMinVehicleCapacityAllowed(Math.max(sharedSeatsWanted, minVehicleCapacityAllowed - 1))}>
                          <Ionicons name="remove" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.counterText}>{minVehicleCapacityAllowed}</Text>
                        <TouchableOpacity style={styles.counterBtn} onPress={() => setMinVehicleCapacityAllowed(Math.min(10, minVehicleCapacityAllowed + 1))}>
                          <Ionicons name="add" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}

              <View style={styles.optionSep} />
              <TouchableOpacity
                style={styles.shareToggleRow}
                onPress={() => setIsScheduled(!isScheduled)}
                activeOpacity={0.7}
                disabled={isShare}
              >
                <View style={styles.shareToggleInfo}>
                  <Text style={styles.shareToggleTitle}>Schedule Ride</Text>
                  <Text style={styles.shareToggleDesc}>
                    {isShare ? "Shared rides are always scheduled" : "Book up to 24h in advance"}
                  </Text>
                </View>
                <View style={[styles.toggleOuter, (isScheduled || isShare) && styles.toggleOuterActive]}>
                  <View style={[styles.toggleInner, (isScheduled || isShare) && styles.toggleInnerActive]} />
                </View>
              </TouchableOpacity>

              {isScheduled && (
                <View style={{ marginTop: SPACING.md }}>
                  <Text style={styles.optionSubTitle}>Pickup Time</Text>
                  <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                    <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
                      <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.datePickerText}>{scheduledAt.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowTimePicker(true)}>
                      <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.datePickerText}>
                        {scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showDatePicker && (
                    <DateTimePicker
                      value={scheduledAt}
                      mode="date"
                      minimumDate={new Date()}
                      maximumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                      onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) setScheduledAt(date);
                      }}
                    />
                  )}
                  {showTimePicker && (
                    <DateTimePicker
                      value={scheduledAt}
                      mode="time"
                      onChange={(event, date) => {
                        setShowTimePicker(false);
                        if (date) setScheduledAt(date);
                      }}
                    />
                  )}
                </View>
              )}
            </Card>
          </View>

          {/* Summary */}
          <View style={styles.section}>
            {loading && !currentQuote ? (
              <Skeleton width="100%" height={24} style={{ marginTop: 8 }} />
            ) : (
              <>
                <View style={[styles.fareRow, { paddingHorizontal: 4 }]}>
                  <Text style={styles.fareKey}>Total Distance</Text>
                  <Text style={styles.fareVal}>{estDist || "—"} km</Text>
                </View>
                {!hasAvailableDriver && availability?.message && (
                  <Text style={styles.errorText}>{availability.message}</Text>
                )}
              </>
            )}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <Button
            title={loading ? "Calculating…" : `Confirm & Book • ₹${Number(estFare || 0).toFixed(2)}`}
            onPress={handleBook}
            disabled={loading}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  searchingSafe: { flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" },
  searchingContent: { alignItems: "center" },
  searchingTitle: { ...TYPOGRAPHY.title, color: COLORS.text, marginBottom: 8 },
  searchingSub: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  cancelBtn: { position: "absolute", bottom: SPACING.xxl, width: "90%" },

  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  sectionTitle: { ...TYPOGRAPHY.subtitle, marginBottom: SPACING.sm },

  mapPreview: { height: 200, marginHorizontal: SPACING.lg, marginTop: SPACING.lg, borderRadius: RADIUS.lg, overflow: "hidden" },

  // Locations summary
  locationRow: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md },
  locationDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  locationLabel: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginBottom: 2 },
  locationName: { ...TYPOGRAPHY.body, fontWeight: "600", color: COLORS.text },
  locationSep: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },

  // Ride rows
  rideOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SPACING.md,
    ...SHADOWS.soft,
  },
  rideOptionRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + "10",
  },
  rideOptionIconWrap: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  rideOptionLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: COLORS.text,
  },
  rideOptionLabelActive: {
    fontWeight: "800",
    color: COLORS.primary,
  },
  rideOptionDesc: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rideOptionPrice: {
    ...TYPOGRAPHY.title,
    color: COLORS.text,
  },

  // Payment chips
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + "30" },
  chipText: { ...TYPOGRAPHY.label },
  chipTextActive: { color: COLORS.primary, fontWeight: "700" },

  optionSubTitle: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginBottom: SPACING.md, fontWeight: "700" },
  optionSep: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.lg },
  shareToggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shareToggleInfo: { flex: 1 },
  shareToggleTitle: { ...TYPOGRAPHY.body, fontWeight: "700", color: COLORS.text },
  shareToggleDesc: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginTop: 2 },
  toggleOuter: { width: 44, height: 24, borderRadius: 12, backgroundColor: COLORS.border, padding: 2 },
  toggleOuterActive: { backgroundColor: COLORS.primary },
  toggleInner: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.surface },
  toggleInnerActive: { alignSelf: "flex-end" },

  // Fare
  fareSummaryTitle: { ...TYPOGRAPHY.subtitle, marginBottom: SPACING.md },
  fareRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  fareKey: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  fareVal: { ...TYPOGRAPHY.body, fontWeight: "600" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  fareTotalKey: { ...TYPOGRAPHY.body, fontWeight: "800" },
  fareTotalVal: { ...TYPOGRAPHY.title, color: COLORS.primary },
  errorText: { ...TYPOGRAPHY.label, color: COLORS.error, marginTop: SPACING.md, fontWeight: "600" },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    ...SHADOWS.card,
  },

  // Searching Step Styles
  searchingSafe: { flex: 1, backgroundColor: COLORS.background },
  searchingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: { ...TYPOGRAPHY.subtitle, fontWeight: "800" },
  backBtn: { padding: SPACING.xs },
  searchingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  lottiePlaceholder: {
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xxl,
  },
  pulseCircle: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.5,
  },
  searchingTitle: {
    ...TYPOGRAPHY.title,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  searchingSub: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  tipCard: {
    flexDirection: "row",
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight + "15",
    borderColor: COLORS.primaryLight,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
  },
  tipText: {
    flex: 1,
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    lineHeight: 18,
  },
  counterRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  counterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  counterText: { ...TYPOGRAPHY.title, fontSize: 18 },
  datePickerBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, borderRadius: RADIUS.md,
    justifyContent: "center"
  },
  datePickerText: { ...TYPOGRAPHY.body, fontWeight: "600", color: COLORS.text },
});
