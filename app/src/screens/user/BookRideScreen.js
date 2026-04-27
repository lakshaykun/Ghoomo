import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { createRideBooking, fetchRideQuote } from "../../store/slices/bookingSlice";
import Header from "../../components/common/Header";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Skeleton from "../../components/common/Skeleton";
import OsmRouteMap from "../../components/map/OsmRouteMap";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, FARES, SHADOWS } from "../../constants";
import { api } from "../../services/api";

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

function SimpleField({ label, leftIcon, rightIcon, value, onChangeText, placeholder, autoCorrect, autoCapitalize, returnKeyType, inputRef }) {
  return (
    <View style={styles.field}>
      <View style={styles.inputWrap}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          value={value ?? ""}
          onChangeText={onChangeText}
          autoCorrect={autoCorrect}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
    </View>
  );
}

export default function BookRideScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const dropInputRef = useRef(null);
  const user = useSelector((s) => s.auth.user);
  const { currentQuote, loading, error } = useSelector((s) => s.booking);
  const { rideType: initType = "cab", presetPickup = null, presetDrop = null, destination = null } = route.params || {};

  const [step, setStep] = useState(1); // 1: Location, 2: Confirm, 3: Searching
  const [pickupInput, setPickupInput] = useState("");
  const [dropInput, setDropInput] = useState(destination || "");
  const [pickupPlace, setPickupPlace] = useState(null);
  const [dropPlace, setDropPlace] = useState(null);
  const [isShare, setIsShare] = useState(false);
  const [pickupResults, setPickupResults] = useState([]);
  const [dropResults, setDropResults] = useState([]);
  const [searching, setSearching] = useState(null);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [sharedSeatsWanted, setSharedSeatsWanted] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedType, setSelectedType] = useState(initType);

  const currentRide = RIDE_OPTIONS.find((r) => r.type === selectedType) || RIDE_OPTIONS[2];
  const fareKey = isShare && currentRide?.shareable ? selectedType + "Share" : selectedType;
  const fareInfo = FARES[fareKey] || FARES[selectedType];
  const estimate = currentQuote?.estimate;
  const availability = currentQuote?.availability;
  const hasAvailableDriver = Boolean(currentQuote?.availability?.available);
  const estDist = estimate?.distanceKm || 0;
  const estFare = estimate?.fare || fareInfo.base;

  useEffect(() => {
    if (presetPickup) {
      setPickupPlace(presetPickup);
      setPickupInput(presetPickup.name || presetPickup.address || "");
    }
    if (presetDrop) {
      setDropPlace(presetDrop);
      setDropInput(presetDrop.name || presetDrop.address || "");
    }
  }, [presetPickup, presetDrop]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!mounted) return;
      const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCurrentCoords(coords);
      try {
        const { place } = await api.reverseGeocode(coords);
        if (!mounted) return;
        if (!presetPickup && !pickupPlace) {
          setPickupPlace(place);
          setPickupInput(place.name);
        }
      } catch (_error) {
        if (!mounted) return;
        if (!presetPickup && !pickupPlace) {
          setPickupPlace(coords);
        }
      }
    })();
    return () => { mounted = false; };
  }, [presetPickup, pickupPlace]);

  useEffect(() => {
    if (!pickupPlace || !dropPlace) return;
    dispatch(fetchRideQuote({
      rideType: selectedType,
      isShare: isShare && currentRide?.shareable,
      pickup: pickupPlace,
      drop: dropPlace,
      scheduledAt: null,
    })).catch(() => {});
  }, [dispatch, dropPlace, currentRide?.shareable, isShare, pickupPlace, selectedType]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (pickupInput.trim().length < 3 || (pickupPlace && pickupPlace.name === pickupInput.trim())) {
        setPickupResults([]);
        return;
      }
      setSearching("pickup");
      api.searchPlaces({ query: pickupInput.trim(), latitude: currentCoords?.latitude, longitude: currentCoords?.longitude })
        .then(({ places }) => setPickupResults(places))
        .catch(() => setPickupResults([]))
        .finally(() => setSearching(null));
    }, 350);
    return () => clearTimeout(timeout);
  }, [currentCoords?.latitude, currentCoords?.longitude, pickupInput, pickupPlace]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (dropInput.trim().length < 3 || (dropPlace && dropPlace.name === dropInput.trim())) {
        setDropResults([]);
        return;
      }
      setSearching("drop");
      api.searchPlaces({ query: dropInput.trim(), latitude: currentCoords?.latitude, longitude: currentCoords?.longitude })
        .then(({ places }) => setDropResults(places))
        .catch(() => setDropResults([]))
        .finally(() => setSearching(null));
    }, 350);
    return () => clearTimeout(timeout);
  }, [currentCoords?.latitude, currentCoords?.longitude, dropInput, dropPlace]);

  const applyPlace = (type, place) => {
    if (type === "pickup") {
      setPickupPlace(place);
      setPickupInput(place.name);
      setPickupResults([]);
      setTimeout(() => dropInputRef.current?.focus?.(), 150);
      return;
    }
    setDropPlace(place);
    setDropInput(place.name);
    setDropResults([]);
  };

  const handleNextStep = () => {
    if (!pickupPlace || !dropPlace) {
      Alert.alert("Missing Info", "Please choose pickup and drop locations.");
      return;
    }
    setStep(2);
  };

  const handleBook = () => {
    if (!hasAvailableDriver) {
      Alert.alert("No Driver Available", availability?.message || "No nearby online driver is available right now.");
      return;
    }
    setStep(3); // Go to searching state
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
      .catch((bookingError) => {
        Alert.alert("Booking Failed", bookingError.message || "Unable to create ride");
        setStep(2); // Retry
      });
  };

  if (step === 3) {
    return (
      <SafeAreaView style={styles.searchingSafe}>
        <View style={styles.searchingContent}>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: SPACING.xl }} />
          <Text style={styles.searchingTitle}>Finding your ride...</Text>
          <Text style={styles.searchingSub}>Contacting nearby {currentRide.label} drivers</Text>
        </View>
        <Button title="Cancel Search" variant="secondary" onPress={() => setStep(2)} style={styles.cancelBtn} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header
        title={step === 1 ? "Select Locations" : "Confirm Ride"}
        onBack={() => {
          if (step === 2) setStep(1);
          else navigation.goBack();
        }}
      />
      <KeyboardAvoidingView style={styles.contentWrap} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {step === 1 && (
            <>
              <View style={styles.mapPreview}>
                <OsmRouteMap pickup={pickupPlace || currentCoords} drop={dropPlace} />
              </View>
              <View style={styles.section}>
                <Card>
                  <SimpleField
                    placeholder="Pickup Location"
                    value={pickupInput}
                    onChangeText={(val) => { setPickupInput(val); setPickupPlace(null); }}
                    leftIcon={<Ionicons name="ellipse" size={16} color={COLORS.success} />}
                    rightIcon={searching === "pickup" ? <ActivityIndicator size="small" color={COLORS.primary} /> : null}
                  />
                  {pickupResults.map((place) => (
                    <TouchableOpacity key={place.id} style={styles.resultRow} onPress={() => applyPlace("pickup", place)}>
                      <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.resultText} numberOfLines={2}>{place.name}</Text>
                    </TouchableOpacity>
                  ))}
                  <View style={styles.swapLine} />
                  <SimpleField
                    placeholder="Drop Location"
                    value={dropInput}
                    onChangeText={(val) => { setDropInput(val); setDropPlace(null); }}
                    inputRef={dropInputRef}
                    leftIcon={<Ionicons name="location" size={16} color={COLORS.error} />}
                    rightIcon={searching === "drop" ? <ActivityIndicator size="small" color={COLORS.primary} /> : null}
                  />
                  {dropResults.map((place) => (
                    <TouchableOpacity key={place.id} style={styles.resultRow} onPress={() => applyPlace("drop", place)}>
                      <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.resultText} numberOfLines={2}>{place.name}</Text>
                    </TouchableOpacity>
                  ))}
                </Card>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              {/* Vehicle Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ride Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md }}>
                  {RIDE_OPTIONS.map((ride) => (
                    <TouchableOpacity
                      key={ride.type}
                      style={[styles.rideTypeCard, selectedType === ride.type && styles.rideTypeCardActive]}
                      onPress={() => setSelectedType(ride.type)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name={ride.icon} size={28} color={selectedType === ride.type ? COLORS.primary : COLORS.grayDark} />
                      <Text style={[styles.rideTypeLabel, selectedType === ride.type && styles.rideTypeLabelActive]}>{ride.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Map Preview for Confirmation */}
              <View style={[styles.mapPreview, { marginHorizontal: SPACING.lg, borderRadius: RADIUS.lg, height: 160 }]}>
                 <OsmRouteMap pickup={pickupPlace} drop={dropPlace} />
              </View>

              {/* Payment & Summary */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment</Text>
                <Card>
                  <View style={styles.choiceRow}>
                    {PAYMENT_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.key}
                        style={[styles.choiceChip, paymentMethod === option.key && styles.choiceChipActive]}
                        onPress={() => setPaymentMethod(option.key)}
                      >
                        <Ionicons
                          name={option.icon}
                          size={16}
                          color={paymentMethod === option.key ? COLORS.primary : COLORS.textSecondary}
                        />
                        <Text style={[styles.choiceText, paymentMethod === option.key && styles.choiceTextActive]}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Card>
              </View>

              <View style={styles.section}>
                <Card>
                  <Text style={styles.fareSummaryTitle}>Estimate</Text>
                  {loading && !currentQuote ? (
                    <Skeleton width="100%" height={24} style={{ marginTop: 8 }} />
                  ) : (
                    <>
                      <View style={styles.fareRow}>
                        <Text style={styles.fareKey}>Total Distance</Text>
                        <Text style={styles.fareVal}>{estDist || "--"} km</Text>
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
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        {step === 1 ? (
          <Button
            title="Next: Confirm Details"
            onPress={handleNextStep}
            disabled={!pickupPlace || !dropPlace}
            size="lg"
          />
        ) : (
          <Button
            title={loading ? "Calculating..." : `Confirm & Book • ₹${estFare}`}
            onPress={handleBook}
            disabled={loading || !hasAvailableDriver}
            size="lg"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  searchingSafe: { flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" },
  searchingContent: { alignItems: "center" },
  searchingTitle: { ...TYPOGRAPHY.title, color: COLORS.text, marginBottom: 8 },
  searchingSub: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  cancelBtn: { position: "absolute", bottom: SPACING.xxl, width: "90%" },
  contentWrap: { flex: 1 },
  scroll: { flex: 1 },
  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  sectionTitle: { ...TYPOGRAPHY.subtitle, marginBottom: SPACING.sm },
  mapPreview: { height: 200, width: "100%", overflow: "hidden", backgroundColor: COLORS.surface },
  field: { marginBottom: SPACING.sm },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  input: { flex: 1, ...TYPOGRAPHY.body },
  iconLeft: { marginRight: 10 },
  iconRight: { marginLeft: 10 },
  swapLine: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  resultRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  resultText: { flex: 1, ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  rideTypeCard: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },
  rideTypeCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + "30" },
  rideTypeLabel: { ...TYPOGRAPHY.label, marginTop: 8 },
  rideTypeLabelActive: { color: COLORS.primary, fontWeight: "700" },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  choiceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  choiceChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + "30" },
  choiceText: { ...TYPOGRAPHY.label },
  choiceTextActive: { color: COLORS.primary, fontWeight: "700" },
  fareSummaryTitle: { ...TYPOGRAPHY.subtitle, marginBottom: SPACING.md },
  fareRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  fareKey: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  fareVal: { ...TYPOGRAPHY.body, fontWeight: "600" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  fareTotalKey: { ...TYPOGRAPHY.body, fontWeight: "800" },
  fareTotalVal: { ...TYPOGRAPHY.title, color: COLORS.primary },
  errorText: { ...TYPOGRAPHY.label, color: COLORS.error, marginTop: SPACING.md, fontWeight: "600" },
  bottomBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.card,
  },
});
