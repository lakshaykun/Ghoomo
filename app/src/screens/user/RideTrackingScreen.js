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
import { subscribeGlobalRealtime, subscribeRideRealtime } from "../../services/realtime";
import { fetchOSRMRoute } from "../../utils/map";
import { api } from "../../services/api";

const EMPTY_ROUTE_POINTS = [];

const STATUS_STEPS = [
  { key: BOOKING_STATUS.PENDING, label: "Finding Driver", icon: "search", color: COLORS.warning },
  { key: BOOKING_STATUS.ACCEPTED, label: "Driver Assigned", icon: "person", color: COLORS.primary },
  { key: BOOKING_STATUS.ARRIVED, label: "Driver Arrived", icon: "pin", color: COLORS.success },
  { key: BOOKING_STATUS.OTP_VERIFIED, label: "OTP Verified", icon: "key", color: COLORS.success },
  { key: BOOKING_STATUS.IN_PROGRESS, label: "On Trip", icon: "navigate", color: COLORS.success },
  { key: BOOKING_STATUS.COMPLETED, label: "Completed", icon: "checkmark-circle", color: COLORS.success },
];

export default function RideTrackingScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const booking = useSelector((s) => s?.booking?.activeBooking);
  const authToken = useSelector((s) => s?.auth?.token || s?.auth?.accessToken || null);
  const lastBookingRef = useRef(null);
  const isRedirectingRef = useRef(false);
  const [sharedRequest, setSharedRequest] = useState(null);
  const [completionRide, setCompletionRide] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState(null);
  const [routeData, setRouteData] = useState(null);

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

    const unsubscribeGlobal = subscribeGlobalRealtime(authToken, {
      onEvent: (event, data) => {
        if (event === "driver_location_updated" && data.rideId === booking?.id) {
          dispatch(setActiveBooking({
            ...booking,
            driver: {
              ...(booking?.driver || {}),
              latitude: data.latitude,
              longitude: data.longitude,
            }
          }));
        } else if (event === "ride_status_updated" && (data.ride?.id === booking?.id || data.id === booking?.id)) {
          const updatedRide = data.ride || data;
          if (updatedRide.status === BOOKING_STATUS.COMPLETED) {
            setCompletionRide(updatedRide);
            dispatch(setActiveBooking(updatedRide));
          } else if (updatedRide.status === BOOKING_STATUS.CANCELLED) {
            goHomeFast();
            dispatch(finalizeBooking(updatedRide));
          } else {
            dispatch(setActiveBooking(updatedRide));
          }
        }
      },
      onError: () => refresh(),
    });

    api.getSharedRideByRide(booking?.id).then(({ request }) => setSharedRequest(request)).catch(() => setSharedRequest(null));
    const intervalId = setInterval(() => {
      api.getSharedRideByRide(booking?.id).then(({ request }) => setSharedRequest(request)).catch(() => setSharedRequest(null));
    }, 7000);

    return () => {
      unsubscribeGlobal();
      clearInterval(intervalId);
    };
  }, [booking?.id, dispatch]);

  useEffect(() => {
    if (booking?.status && [BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.ARRIVED, BOOKING_STATUS.OTP_VERIFIED, BOOKING_STATUS.IN_PROGRESS].includes(booking.status)) {
      // Like Uber: always show the trip path (pickup -> drop)
      const source = booking.pickup;
      const destination = booking.drop;

      if (source?.latitude && source?.longitude && destination?.latitude && destination?.longitude) {
        // Only fetch if they are different enough to matter (approx > 15m)
        const dLat = Math.abs(source.latitude - destination.latitude);
        const dLon = Math.abs(source.longitude - destination.longitude);
        if (dLat < 0.00015 && dLon < 0.00015) {
           setRouteData({ points: [source, destination], distance: 0, duration: 0 });
           return;
        }

        fetchOSRMRoute(source, destination, true).then((res) => {
          if (res && res.points && res.points.length > 0) {
            setRouteData(res);
          }
        }).catch(() => {});
      }
    }
  }, [booking?.pickup?.latitude, booking?.pickup?.longitude, booking?.drop?.latitude, booking?.drop?.longitude, booking?.status]);

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
          dispatch(syncRideStatus(booking?.id, BOOKING_STATUS.CANCELLED, { sourceType: booking?.sourceType }))
            .then(() => navigation.navigate("UserHome"))
            .catch((error) => Alert.alert("Cancel Failed", error.message));
        },
      },
    ]);
  };

  const handleLeave = () => {
    Alert.alert("Leave Shared Ride", "Are you sure you want to leave this shared ride?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Leave",
        style: "destructive",
        onPress: () => {
          api.leaveSharedRide(booking.id, user.id)
            .then(() => {
              dispatch(setActiveBooking(null));
              navigation.navigate("UserHome");
            })
            .catch((error) => Alert.alert("Leave Failed", error.message));
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
      return <Button title={`Share OTP: ${booking.otp || "----"}`} onPress={handleShareOtp} variant="primary" size="lg" />;
    }
    if (booking.status === BOOKING_STATUS.IN_PROGRESS) {
      return null; // Don't show "Arriving in" block after OTP/trip starts
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.mapArea}>
        <OsmRouteMap pickup={booking.pickup} drop={booking.drop} driver={booking.driver} routePoints={routeData?.points || booking.route?.geometry || []} />
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
                : booking.status === BOOKING_STATUS.ACCEPTED ? (booking?.driver?.name ? `${booking.driver.name} is on the way` : "Driver is being assigned...")
                : booking.status === BOOKING_STATUS.ARRIVED ? "Driver is waiting at pickup"
                : booking.status === BOOKING_STATUS.OTP_VERIFIED ? "OTP verified, start trip"
                : booking.status === BOOKING_STATUS.IN_PROGRESS ? `Heading to ${booking.drop?.name || "destination"}`
                : "Trip completed"}
            </Text>
          </View>
          {routeData && routeData.duration !== undefined && [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.ARRIVED, BOOKING_STATUS.OTP_VERIFIED, BOOKING_STATUS.IN_PROGRESS].includes(booking.status) ? (
            <View style={{ alignItems: "flex-end" }}>
              <View style={styles.etaPill}>
                <Text style={styles.etaPillVal}>{Math.round(routeData.duration / 60)}</Text>
                <Text style={styles.etaPillLabel}>MIN</Text>
              </View>
              <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 }}>{Number(routeData.distance / 1000 || 0).toFixed(1)} km</Text>
            </View>
          ) : booking.status === BOOKING_STATUS.ACCEPTED && (
            <View style={styles.etaPill}>
              <Text style={styles.etaPillVal}>{booking.driver?.etaMinutes || "--"}</Text>
              <Text style={styles.etaPillLabel}>MIN</Text>
            </View>
          )}
        </View>

        {/* Fare Summary for Shared Rides */}
        {booking.isShare && booking.final_fare_per_person && (
          <View style={styles.fareSplitRow}>
            <Text style={styles.fareSplitLabel}>Your Share:</Text>
            <Text style={styles.fareSplitValue}>₹{Number(booking.final_fare_per_person).toFixed(2)}</Text>
          </View>
        )}

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
        {booking.driver && booking.status !== BOOKING_STATUS.PENDING ? (
          <View style={styles.driverSection}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{(booking.driver.name || "D")[0]}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{booking.driver.name || "Driver"}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={COLORS.warning} />
                <Text style={styles.ratingText}>{booking.driver.rating || "5.0"} • {booking.driver.vehicleType || "Ride"}</Text>
              </View>
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleNo}>{booking.driver.vehicleNo || "N/A"}</Text>
            </View>
            {driverPhone && (
              <TouchableOpacity style={styles.callBtn} onPress={handleCallDriver}>
                <Ionicons name="call" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        ) : booking.status !== BOOKING_STATUS.PENDING && (
          <View style={styles.driverSection}>
             <Text style={{ ...TYPOGRAPHY.label, color: COLORS.textSecondary }}>Driver details loading...</Text>
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

        {/* Secondary Action (Cancel / Leave) */}
        {(booking.status === BOOKING_STATUS.ACCEPTED || booking.status === BOOKING_STATUS.ARRIVED || booking.status === BOOKING_STATUS.PENDING || booking.status === 'OPEN' || booking.status === 'SCHEDULED') && (
          <TouchableOpacity 
            style={styles.secondaryAction} 
            onPress={booking.isShare && sharedRequest?.ownerId !== user.id ? handleLeave : handleCancel}
          >
            <Text style={styles.secondaryActionText}>
              {booking.isShare && sharedRequest?.ownerId !== user.id ? "Leave Shared Ride" : "Cancel Ride"}
            </Text>
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
  fareSplitRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.primaryLight + "15", padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.lg },
  fareSplitLabel: { ...TYPOGRAPHY.body, fontWeight: "700", color: COLORS.primary },
  fareSplitValue: { ...TYPOGRAPHY.subtitle, color: COLORS.primary, fontWeight: "900" },
});
