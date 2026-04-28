import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Modal, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { finalizeBooking, rateRideBooking, refreshActiveRide, setActiveBooking, syncRideStatus } from "../../store/slices/bookingSlice";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, BOOKING_STATUS } from "../../constants";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import OsmRouteMap from "../../components/map/OsmRouteMap";
import { api } from "../../services/api";
import { subscribeRideRealtime } from "../../services/realtime";

const EMPTY_ROUTE_POINTS = [];

const STATUS_STEPS = [
  { key: BOOKING_STATUS.PENDING, label: "Finding Driver", icon: "search", color: COLORS.warning },
  { key: BOOKING_STATUS.ACCEPTED, label: "Driver Assigned", icon: "person", color: COLORS.primary },
  { key: BOOKING_STATUS.ARRIVED, label: "Driver Arrived", icon: "pin", color: COLORS.success },
  { key: BOOKING_STATUS.IN_PROGRESS, label: "On Trip", icon: "navigate", color: COLORS.success },
  { key: BOOKING_STATUS.COMPLETED, label: "Completed", icon: "checkmark-circle", color: COLORS.success },
];

export default function RideTrackingScreen({ navigation }) {
  const dispatch = useDispatch();
  const booking = useSelector((s) => s.booking.activeBooking);
  const lastBookingRef = useRef(null);
  const isRedirectingRef = useRef(false);
  const [sharedRequest, setSharedRequest] = useState(null);
  const [completionRide, setCompletionRide] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState(null);

  const goHomeFast = () => {
    if (isRedirectingRef.current) return;
    isRedirectingRef.current = true;
    navigation.reset({ index: 0, routes: [{ name: "UserHome" }] });
  };

  useEffect(() => {
    if (booking) {
      lastBookingRef.current = booking;
      if (booking.status === BOOKING_STATUS.CANCELLED) {
        goHomeFast();
        return;
      }
      if (booking.status === BOOKING_STATUS.COMPLETED) {
        setCompletionRide(booking);
      }
      return;
    }
    const lastBooking = lastBookingRef.current;
    if (!lastBooking) {
      goHomeFast();
      return;
    }
    if (lastBooking.status === BOOKING_STATUS.COMPLETED) {
      setCompletionRide(lastBooking);
      return;
    }
    if (lastBooking.status === BOOKING_STATUS.CANCELLED) {
      goHomeFast();
    }
  }, [booking, navigation]);

  useEffect(() => {
    if (booking?.status !== BOOKING_STATUS.COMPLETED) {
      setRatingError(null);
      setRatingComment("");
      setRatingValue(5);
    }
  }, [booking?.id, booking?.status]);

  useEffect(() => {
    if (!booking?.id) return undefined;

    const refresh = () => dispatch(refreshActiveRide(booking.id)).catch(() => {});
    refresh();

    const unsubscribeRealtime = subscribeRideRealtime(booking.id, {
      onRideUpdate: (ride) => {
        if (ride.status === BOOKING_STATUS.COMPLETED) {
          setCompletionRide(ride);
          dispatch(setActiveBooking(ride));
          return;
        }
        if (ride.status === BOOKING_STATUS.CANCELLED) {
          goHomeFast();
          dispatch(finalizeBooking(ride));
          return;
        }
        dispatch(setActiveBooking(ride));
      },
      onError: () => refresh(),
    });

    api.getSharedRideByRide(booking.id).then(({ request }) => setSharedRequest(request)).catch(() => setSharedRequest(null));
    const intervalId = setInterval(() => {
      api.getSharedRideByRide(booking.id).then(({ request }) => setSharedRequest(request)).catch(() => setSharedRequest(null));
    }, 7000);

    return () => {
      unsubscribeRealtime();
      clearInterval(intervalId);
    };
  }, [booking?.id, dispatch]);

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={42} color={COLORS.grayDark} />
          <Text style={styles.emptyTitle}>Updating...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusIdx = STATUS_STEPS.findIndex((s) => s.key === booking.status);
  const currentStep = STATUS_STEPS[statusIdx] || STATUS_STEPS[0];

  const handleCancel = () => {
    Alert.alert("Cancel Ride", "Are you sure you want to cancel?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: () => {
          dispatch(syncRideStatus(booking.id, BOOKING_STATUS.CANCELLED))
            .then(() => navigation.navigate("UserHome"))
            .catch((error) => Alert.alert("Cancel Failed", error.message));
        },
      },
    ]);
  };

  const handleShareOtp = () => {
    Alert.alert("Share OTP", `Tell this OTP to your driver: ${booking.otp}`);
  };

  const driverPhone = booking?.driver?.phone || booking?.driver?.phoneNumber || booking?.driver?.mobile || booking?.driver?.mobileNumber || null;

  const handleCallDriver = () => {
    if (!driverPhone) return;
    Linking.openURL(`tel:${driverPhone}`).catch(() => Alert.alert("Call Failed", "Unable to open dialer."));
  };

  const rideForRating = completionRide || (booking?.status === BOOKING_STATUS.COMPLETED ? booking : null);

  const handleSubmitRating = async () => {
    if (!rideForRating) return;
    setRatingSubmitting(true);
    setRatingError(null);
    try {
      await dispatch(rateRideBooking(rideForRating.id, { rating: ratingValue, reviewText: ratingComment.trim() }));
      dispatch(finalizeBooking(rideForRating));
      setCompletionRide(null);
      goHomeFast();
    } catch (error) {
      setRatingError(error.message || "Unable to submit rating");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleSkipRating = () => {
    if (rideForRating) dispatch(finalizeBooking(rideForRating));
    setCompletionRide(null);
    goHomeFast();
  };

  const renderPrimaryAction = () => {
    if (booking.status === BOOKING_STATUS.PENDING) {
      return <Button title="Cancel Search" onPress={handleCancel} variant="danger" size="lg" />;
    }
    if (booking.status === BOOKING_STATUS.ACCEPTED || booking.status === BOOKING_STATUS.ARRIVED) {
      return <Button title={`Share OTP: ${booking.otp}`} onPress={handleShareOtp} variant="primary" size="lg" />;
    }
    if (booking.status === BOOKING_STATUS.IN_PROGRESS) {
      return (
        <View style={styles.etaContainer}>
          <Text style={styles.etaLabel}>Arriving in</Text>
          <Text style={styles.etaValue}>{booking.durationMinutes} min</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.mapArea}>
        <OsmRouteMap pickup={booking.pickup} drop={booking.drop} driver={booking.driver} routePoints={booking.route?.geometry ?? EMPTY_ROUTE_POINTS} />
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={[styles.statusIcon, { backgroundColor: currentStep.color + "20" }]}>
            <Ionicons name={currentStep.icon} size={24} color={currentStep.color} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>{currentStep.label}</Text>
            <Text style={styles.statusSub}>
              {booking.status === BOOKING_STATUS.PENDING ? "Searching for nearby drivers"
                : booking.status === BOOKING_STATUS.ACCEPTED ? `${booking.driver?.name} is on the way`
                : booking.status === BOOKING_STATUS.ARRIVED ? "Driver is waiting at pickup"
                : booking.status === BOOKING_STATUS.IN_PROGRESS ? `Heading to ${booking.drop?.name}`
                : "Trip completed"}
            </Text>
          </View>
          {booking.status === BOOKING_STATUS.ACCEPTED && (
            <View style={styles.etaPill}>
              <Text style={styles.etaPillVal}>{booking.driver?.etaMinutes || "--"}</Text>
              <Text style={styles.etaPillLabel}>MIN</Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressRow}>
          {STATUS_STEPS.map((step, i) => (
            <React.Fragment key={step.key}>
              <View style={[styles.progressDot, i <= statusIdx && { backgroundColor: COLORS.primary }]} />
              {i < STATUS_STEPS.length - 1 && <View style={[styles.progressLine, i < statusIdx && { backgroundColor: COLORS.primary }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Driver Info */}
        {booking.driver && booking.status !== BOOKING_STATUS.PENDING && (
          <View style={styles.driverSection}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{booking.driver.name[0]}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{booking.driver.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={COLORS.warning} />
                <Text style={styles.ratingText}>{booking.driver.rating} • {booking.driver.vehicleType}</Text>
              </View>
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleNo}>{booking.driver.vehicleNo}</Text>
            </View>
            {driverPhone && (
              <TouchableOpacity style={styles.callBtn} onPress={handleCallDriver}>
                <Ionicons name="call" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Shared Ride Info */}
        {booking.isShare && sharedRequest ? (
          <View style={styles.sharedSection}>
            <Text style={styles.sharedTitle}>Shared Ride ({sharedRequest.acceptedCount}/{sharedRequest.requestedSeats} joined)</Text>
            <View style={styles.chipsRow}>
              <View style={[styles.participantChip, styles.ownerChip]}><Text style={styles.ownerChipText}>You</Text></View>
              {sharedRequest.acceptedUsers.map((p) => (
                <View key={p.userId} style={styles.participantChip}><Text style={styles.participantChipText}>{p.name}</Text></View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Primary Action */}
        <View style={styles.actionsRow}>
          {renderPrimaryAction()}
        </View>

        {/* Secondary Action (Cancel) */}
        {(booking.status === BOOKING_STATUS.ACCEPTED || booking.status === BOOKING_STATUS.ARRIVED) && (
          <TouchableOpacity style={styles.secondaryAction} onPress={handleCancel}>
            <Text style={styles.secondaryActionText}>Cancel Ride</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={Boolean(rideForRating)} transparent animationType="fade" onRequestClose={handleSkipRating}>
        <View style={styles.ratingBackdrop}>
          <View style={styles.ratingSheet}>
            <Text style={styles.ratingTitle}>Rate your trip</Text>
            <Text style={styles.ratingSubtitle}>How was your ride with {rideForRating?.driver?.name}?</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setRatingValue(star)} style={styles.starButton}>
                  <Ionicons name={star <= ratingValue ? "star" : "star-outline"} size={36} color={star <= ratingValue ? COLORS.warning : COLORS.borderStrong} />
                </Pressable>
              ))}
            </View>
            <TextInput
              value={ratingComment}
              onChangeText={setRatingComment}
              placeholder="Add a review (optional)"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              style={styles.ratingInput}
            />
            {ratingError && <Text style={styles.ratingError}>{ratingError}</Text>}
            <View style={styles.ratingActions}>
              <Button title="Skip" onPress={handleSkipRating} variant="secondary" style={{ flex: 1 }} />
              <Button title={ratingSubmitting ? "Submitting..." : "Submit"} onPress={handleSubmitRating} disabled={ratingSubmitting} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { ...TYPOGRAPHY.title, color: COLORS.textSecondary },
  mapArea: { flex: 1 },
  bottomSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    ...SHADOWS.card,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.borderStrong, borderRadius: 2, alignSelf: "center", marginBottom: SPACING.md },
  statusHeader: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.lg },
  statusIcon: { width: 48, height: 48, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center" },
  statusInfo: { flex: 1, marginLeft: SPACING.md },
  statusLabel: { ...TYPOGRAPHY.title },
  statusSub: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginTop: 2 },
  etaPill: { alignItems: "center", backgroundColor: COLORS.primaryLight + "30", borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 8 },
  etaPillVal: { ...TYPOGRAPHY.title, color: COLORS.primary },
  etaPillLabel: { fontSize: 10, fontWeight: "800", color: COLORS.primary },
  progressRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.lg },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.borderStrong },
  progressLine: { flex: 1, height: 2, backgroundColor: COLORS.borderStrong, marginHorizontal: 4 },
  driverSection: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.background, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.lg },
  driverAvatar: { width: 48, height: 48, borderRadius: RADIUS.pill, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  driverAvatarText: { fontSize: 20, fontWeight: "800", color: COLORS.surface },
  driverInfo: { flex: 1, marginLeft: SPACING.md },
  driverName: { ...TYPOGRAPHY.subtitle },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  ratingText: { ...TYPOGRAPHY.label },
  vehicleInfo: { alignItems: "flex-end", marginRight: SPACING.md },
  vehicleNo: { ...TYPOGRAPHY.label, fontWeight: "700", backgroundColor: COLORS.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  callBtn: { width: 40, height: 40, borderRadius: RADIUS.pill, backgroundColor: COLORS.primaryLight + "30", alignItems: "center", justifyContent: "center" },
  sharedSection: { marginBottom: SPACING.lg },
  sharedTitle: { ...TYPOGRAPHY.label, marginBottom: 8 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  participantChip: { backgroundColor: COLORS.background, borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  participantChipText: { ...TYPOGRAPHY.label },
  ownerChip: { backgroundColor: COLORS.success + "15", borderColor: COLORS.success },
  ownerChipText: { ...TYPOGRAPHY.label, color: COLORS.success, fontWeight: "700" },
  actionsRow: { marginTop: SPACING.sm },
  etaContainer: { alignItems: "center", paddingVertical: SPACING.md },
  etaLabel: { ...TYPOGRAPHY.label, color: COLORS.textSecondary },
  etaValue: { fontSize: 32, fontWeight: "900", color: COLORS.primary },
  secondaryAction: { alignItems: "center", marginTop: SPACING.md, paddingVertical: SPACING.sm },
  secondaryActionText: { ...TYPOGRAPHY.body, color: COLORS.error, fontWeight: "600" },
  ratingBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: SPACING.lg },
  ratingSheet: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: "center" },
  ratingTitle: { ...TYPOGRAPHY.title, marginBottom: 4 },
  ratingSubtitle: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: SPACING.lg, textAlign: "center" },
  starRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.lg },
  starButton: { padding: 4 },
  ratingInput: { width: "100%", minHeight: 100, backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, ...TYPOGRAPHY.body, textAlignVertical: "top", marginBottom: SPACING.lg },
  ratingError: { ...TYPOGRAPHY.label, color: COLORS.error, marginBottom: SPACING.md },
  ratingActions: { flexDirection: "row", gap: SPACING.md, width: "100%" },
});
