import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  cancelBusSeatBooking,
  createBusSeatBooking,
  fetchBusBookings,
} from "../../store/slices/bookingSlice";
import { fetchBusRoutes } from "../../store/slices/busRoutesSlice";
import Header from "../../components/common/Header";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import QRDisplay from "../../components/common/QRDisplay";
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from "../../constants";
import { sendLocalNotification } from "../../services/notifications";
import {
  formatShortTime,
  formatRelativeMinutes,
  getBookingWindow,
  getRouteOccupancy,
  getDemandLabel,
} from "../../utils/bus";

const createBusBookingId = () =>
  `bus_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ─────────────────────────────────────────────────────────────────────────────
// BusBookingFlowScreen
// Navigated to from BusBookTab with params: { route }
// Flow: Seat selection → Book → QR confirmation
// ─────────────────────────────────────────────────────────────────────────────
export default function BusBookingFlowScreen({ navigation, route: navRoute }) {
  const routeParam = navRoute?.params?.route;

  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const busBookings = useSelector((s) => s.booking.busBookings || []);
  const routes = useSelector((s) => s.busRoutes.routes || []);

  // Always use the freshest version of the route from Redux (seat counts update live)
  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === routeParam?.id) || routeParam,
    [routes, routeParam]
  );

  const [selectedSeatNumber, setSelectedSeatNumber] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null); // set after success
  const [now, setNow] = useState(new Date());

  // Refresh time every 30s for booking window accuracy
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // Load fresh routes + bookings when screen mounts
  useEffect(() => {
    dispatch(fetchBusRoutes()).catch(() => {});
    dispatch(fetchBusBookings()).catch(() => {});
  }, [dispatch]);

  // Reset seat selection when route changes
  useEffect(() => {
    setSelectedSeatNumber(null);
  }, [selectedRoute?.id]);

  if (!selectedRoute) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Header title="Book Bus" onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Ionicons name="bus-outline" size={56} color={COLORS.gray} />
          <Text style={styles.emptyText}>Route not found.</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  const occupancy = getRouteOccupancy(selectedRoute, busBookings);
  const bookingWindow = getBookingWindow(selectedRoute, now);
  const demand = getDemandLabel(occupancy);

  const existingBooking = busBookings.find(
    (b) => b.routeId === selectedRoute.id && b.userId === user?.id && b.status !== "cancelled"
  );

  // ── Handle Book ─────────────────────────────────────────────────────────────
  const handleBook = async () => {
    if (!user || isBooking) return;

    if (existingBooking) {
      Alert.alert(
        "Already Booked",
        existingBooking.isWaiting
          ? `You are already on WL ${existingBooking.waitlistPosition} for this route.`
          : `You already have seat ${existingBooking.seatNumber} booked.`
      );
      return;
    }

    if (!bookingWindow.canBook) {
      Alert.alert(
        "Booking Closed",
        `Booking opens at ${formatShortTime(bookingWindow.opensAt)} and closes at departure.`
      );
      return;
    }

    if (occupancy.availableSeatCount === 0 && occupancy.waitlistRemaining <= 0) {
      Alert.alert("Bus Full", "No seats or waitlist spots are available.");
      return;
    }

    if (occupancy.availableSeatCount > 0 && !selectedSeatNumber) {
      Alert.alert("Select a Seat", "Please tap a seat number to select it before booking.");
      return;
    }

    setIsBooking(true);
    try {
      const booking = await dispatch(
        createBusSeatBooking({
          bookingId: createBusBookingId(),
          routeId: selectedRoute.id,
          userId: user.id,
          userName: user.name,
          seatNumber: selectedSeatNumber,
        })
      );

      sendLocalNotification({
        key: booking.isWaiting ? `bus-wl-${booking.id}` : `bus-booked-${booking.id}`,
        title: booking.isWaiting ? "Added to waiting list" : "Bus seat confirmed! ✅",
        body: booking.isWaiting
          ? `${selectedRoute.name} — WL ${booking.waitlistPosition} reserved.`
          : `${selectedRoute.name} — Seat ${booking.seatNumber} booked.`,
        data: { bookingId: booking.id, routeId: selectedRoute.id, type: "bus" },
      }).catch(() => {});

      setConfirmedBooking({
        ...booking,
        routeName: selectedRoute.name,
      });
    } catch (error) {
      const isDuplicate =
        error.message?.includes("already have an active booking") ||
        error.message?.includes("DUPLICATE");
      Alert.alert(
        isDuplicate ? "Already Booked ⚠️" : "Booking Failed",
        isDuplicate
          ? "You already have an active booking for this route."
          : error.message || "Unable to book seat. Please try again."
      );
    } finally {
      setIsBooking(false);
    }
  };

  // ── Handle Cancel (from confirmed booking card) ──────────────────────────
  const handleCancel = (booking) => {
    if (booking.verified) {
      Alert.alert("Locked", "Verified tickets cannot be cancelled.");
      return;
    }
    Alert.alert("Cancel Booking", "Are you sure you want to cancel?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await dispatch(cancelBusSeatBooking(booking.id));
            Alert.alert("Cancelled", "Your booking has been cancelled.");
            setConfirmedBooking(null);
          } catch (err) {
            Alert.alert("Error", err.message || "Could not cancel booking.");
          }
        },
      },
    ]);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // SUCCESS VIEW — show QR after booking
  // ────────────────────────────────────────────────────────────────────────────
  if (confirmedBooking) {
    const qrData = {
      bookingId: confirmedBooking.id,
      type: "BUS",
      busId: confirmedBooking.routeId,
      seatNo: confirmedBooking.seatNumber,
      waitlistPosition: confirmedBooking.waitlistPosition,
      userId: user.id,
      ts: Date.now(),
    };

    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Header
          title="Booking Confirmed"
          onBack={() => navigation.goBack()}
        />
        <ScrollView contentContainerStyle={styles.successScroll} showsVerticalScrollIndicator={false}>
          {/* Banner */}
          <LinearGradient
            colors={confirmedBooking.isWaiting ? ["#F59E0B", "#D97706"] : [COLORS.success, "#059669"]}
            style={styles.successBanner}
          >
            <Ionicons
              name={confirmedBooking.isWaiting ? "time-outline" : "checkmark-circle"}
              size={56}
              color={COLORS.white}
            />
            <Text style={styles.successTitle}>
              {confirmedBooking.isWaiting
                ? `Waitlist #${confirmedBooking.waitlistPosition}`
                : `Seat ${confirmedBooking.seatNumber} Confirmed`}
            </Text>
            <Text style={styles.successSub}>{confirmedBooking.routeName}</Text>
            <Text style={styles.successFare}>
              Rs {Number(confirmedBooking.fareAmount || selectedRoute.farePerSeat || 0).toFixed(2)}
            </Text>
          </LinearGradient>

          {/* QR Section */}
          <View style={styles.qrSection}>
            <Text style={styles.qrTitle}>
              {confirmedBooking.isWaiting ? "Waitlist QR Code" : "Your Boarding Pass"}
            </Text>
            <Text style={styles.bookingIdText}>ID: {confirmedBooking.id}</Text>
            <Text style={styles.qrSub}>
              {confirmedBooking.isWaiting
                ? "You will be promoted automatically if a seat opens up."
                : "Show this QR to the bus driver when boarding."}
            </Text>
            <QRDisplay
              data={qrData}
              size={200}
              label={
                confirmedBooking.isWaiting
                  ? `WL ${confirmedBooking.waitlistPosition}`
                  : `Seat ${confirmedBooking.seatNumber}`
              }
            />
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <Button
              title="Cancel Booking"
              variant="outline"
              onPress={() => handleCancel(confirmedBooking)}
              style={{ borderColor: COLORS.error }}
              textStyle={{ color: COLORS.error }}
            />
            <Button
              title="Back to Bus Routes"
              onPress={() => navigation.goBack()}
              style={{ marginTop: 12 }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SEAT SELECTION VIEW
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header
        title={selectedRoute.name}
        subtitle={`${selectedRoute.departureTime} → ${selectedRoute.arrivalTime}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Route summary card */}
          <Card elevated style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Badge color={demand.color} label={demand.label} />
              <Text style={styles.fareText}>
                Rs {Number(selectedRoute.farePerSeat || 0).toFixed(2)} / seat
              </Text>
            </View>

            {/* Stops */}
            <View style={styles.stopsRow}>
              {(selectedRoute.stops || []).map((stop, i) => (
                <React.Fragment key={`${stop}-${i}`}>
                  <Text style={styles.stopText}>{stop}</Text>
                  {i < selectedRoute.stops.length - 1 && (
                    <Ionicons name="arrow-forward" size={12} color={COLORS.primary} style={{ marginHorizontal: 4 }} />
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* Timing + availability */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{selectedRoute.departureTime}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>
                  {occupancy.availableSeatCount > 0
                    ? `${occupancy.availableSeatCount} seats free`
                    : occupancy.waitlistRemaining > 0
                    ? `Full — ${occupancy.waitlistRemaining} WL spots`
                    : "Fully booked"}
                </Text>
              </View>
            </View>

            {/* Booking window status */}
            {bookingWindow.canBook ? (
              <Text style={styles.windowOpen}>
                🟢 Booking open — closes at departure
              </Text>
            ) : (
              <Text style={styles.windowClosed}>
                🔴 Booking opens at {formatShortTime(bookingWindow.opensAt)}
              </Text>
            )}
          </Card>

          {/* Existing booking — full card with QR + cancel */}
          {existingBooking && (
            <View style={styles.existingBookingSection}>
              {/* Status banner */}
              <LinearGradient
                colors={
                  existingBooking.isWaiting
                    ? ["#F59E0B", "#D97706"]
                    : [COLORS.success, "#059669"]
                }
                style={styles.existingBanner}
              >
                <View style={styles.existingBannerRow}>
                  <Ionicons
                    name={existingBooking.isWaiting ? "time" : "checkmark-circle"}
                    size={22}
                    color={COLORS.white}
                  />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.existingBannerTitle}>
                      {existingBooking.isWaiting
                        ? `Waitlist Position #${existingBooking.waitlistPosition}`
                        : `Seat ${existingBooking.seatNumber} Booked`}
                    </Text>
                    <Text style={styles.existingBannerSub}>{selectedRoute.name}</Text>
                  </View>
                  <Text style={styles.existingBannerFare}>
                    Rs {Number(existingBooking.fareAmount || selectedRoute.farePerSeat || 0).toFixed(2)}
                  </Text>
                </View>
              </LinearGradient>

              {/* QR code */}
              <View style={styles.existingQrWrap}>
                <Text style={styles.existingQrLabel}>
                  {existingBooking.isWaiting ? "Waitlist QR" : "Boarding Pass"}
                </Text>
                <Text style={styles.existingQrId}>ID: {existingBooking.id}</Text>
                <QRDisplay
                  data={
                    existingBooking.qrCode
                      ? (() => { try { return JSON.parse(existingBooking.qrCode); } catch { return existingBooking.qrCode; } })()
                      : {
                          bookingId: existingBooking.id,
                          type: "BUS",
                          busId: existingBooking.routeId,
                          seatNo: existingBooking.seatNumber,
                          waitlistPosition: existingBooking.waitlistPosition,
                          userId: existingBooking.userId,
                        }
                  }
                  size={180}
                  label={
                    existingBooking.isWaiting
                      ? `WL ${existingBooking.waitlistPosition}`
                      : `Seat ${existingBooking.seatNumber}`
                  }
                />
                <Text style={styles.existingQrHint}>
                  {existingBooking.isWaiting
                    ? "You will be promoted automatically if a seat opens up."
                    : "Show this QR to the bus driver when boarding."}
                </Text>
              </View>

              {/* Cancel button */}
              {!existingBooking.verified ? (
                <TouchableOpacity
                  style={styles.cancelBookingBtn}
                  onPress={() => handleCancel(existingBooking)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={18} color={COLORS.error} />
                  <Text style={styles.cancelBookingBtnText}>Cancel Booking</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.verifiedBadgeRow}>
                  <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
                  <Text style={styles.verifiedBadgeText}>Ticket verified — cannot cancel</Text>
                </View>
              )}
            </View>
          )}

          {/* All seats taken — waitlist info */}
          {bookingWindow.canBook && !existingBooking && occupancy.availableSeatCount === 0 && occupancy.waitlistRemaining > 0 && (
            <Card style={styles.infoCard}>
              <Ionicons name="alert-circle" size={18} color={COLORS.warning} />
              <Text style={styles.infoText}>
                All seats are taken. Tapping "Book" will add you to the waiting list automatically.
              </Text>
            </Card>
          )}

          {/* ── SEAT GRID ── */}
          {bookingWindow.canBook && !existingBooking && occupancy.availableSeatCount > 0 && (
            <View style={styles.seatSection}>
              <Text style={styles.sectionTitle}>Select a Seat</Text>

              {/* Bus layout legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                  <Text style={styles.legendText}>Selected</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.border }]} />
                  <Text style={styles.legendText}>Taken</Text>
                </View>
              </View>

              {/* Bus body */}
              <View style={styles.busBody}>
                {/* Driver row */}
                <View style={styles.driverRow}>
                  <View style={styles.steeringWrap}>
                    <Ionicons name="radio-button-on" size={20} color={COLORS.textSecondary} />
                    <Text style={styles.driverLabel}>Driver</Text>
                  </View>
                  <View style={styles.doorLabel}>
                    <Text style={styles.driverLabel}>Door →</Text>
                  </View>
                </View>

                {/* Seat rows — 2 + aisle + 2 layout */}
                {renderSeatRows(selectedRoute, occupancy, selectedSeatNumber, setSelectedSeatNumber)}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom book bar */}
      {bookingWindow.canBook && !existingBooking && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarInfo}>
            <Text style={styles.bottomBarLabel}>
              {occupancy.availableSeatCount > 0
                ? selectedSeatNumber
                  ? `Seat ${selectedSeatNumber} selected`
                  : "Tap a seat to select"
                : "Waitlist booking"}
            </Text>
            <Text style={styles.bottomBarFare}>
              Rs {Number(selectedRoute.farePerSeat || 0).toFixed(2)}
            </Text>
          </View>
          <Button
            title={isBooking ? "Booking..." : occupancy.availableSeatCount > 0 ? "Book Seat" : "Join Waitlist"}
            onPress={handleBook}
            loading={isBooking}
            disabled={(occupancy.availableSeatCount > 0 && !selectedSeatNumber) || isBooking}
            size="lg"
            style={styles.bookBtn}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Seat grid renderer — 2+2 bus layout with aisle
// ─────────────────────────────────────────────────────────────────────────────
function renderSeatRows(route, occupancy, selectedSeatNumber, onSelect) {
  const total = route.totalSeats || 0;
  const takenSet = new Set(
    (route.bookedSeats || []).concat(
      occupancy.availableSeats
        ? Array.from({ length: total }, (_, i) => i + 1).filter(
            (n) => !occupancy.availableSeats.includes(n)
          )
        : []
    )
  );

  const rows = [];
  // 4 seats per row: [1,2] aisle [3,4]
  for (let i = 0; i < total; i += 4) {
    const rowSeats = [i + 1, i + 2, null, i + 3, i + 4].filter(
      (s) => s === null || s <= total
    );
    rows.push(
      <View key={`row-${i}`} style={styles.seatRow}>
        {rowSeats.map((seatNum, idx) => {
          if (seatNum === null) {
            return <View key="aisle" style={styles.aisle} />;
          }
          const isTaken = takenSet.has(seatNum);
          const isSelected = selectedSeatNumber === seatNum;
          return (
            <TouchableOpacity
              key={`seat-${seatNum}`}
              style={[
                styles.seat,
                isTaken && styles.seatTaken,
                isSelected && styles.seatSelected,
              ]}
              onPress={() => !isTaken && onSelect(isSelected ? null : seatNum)}
              disabled={isTaken}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.seatNum,
                  isTaken && styles.seatNumTaken,
                  isSelected && styles.seatNumSelected,
                ]}
              >
                {seatNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginTop: 12 },

  // ── Summary card ──
  summaryCard: { padding: SPACING.md, marginBottom: SPACING.md },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  fareText: { ...TYPOGRAPHY.subtitle, color: COLORS.primary, fontWeight: "700" },
  stopsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  stopText: { ...TYPOGRAPHY.caption, color: COLORS.text, fontWeight: "600" },
  metaRow: { flexDirection: "row", gap: 16, marginBottom: SPACING.sm },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  windowOpen: { fontSize: 12, color: COLORS.success, fontWeight: "600" },
  windowClosed: { fontSize: 12, color: COLORS.error, fontWeight: "600" },

  // ── Info card ──
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
  },
  infoText: { ...TYPOGRAPHY.caption, color: COLORS.text, flex: 1, lineHeight: 18 },

  // ── Seat section ──
  seatSection: { marginBottom: SPACING.xl },
  sectionTitle: { ...TYPOGRAPHY.subtitle, color: COLORS.text, marginBottom: SPACING.sm },
  legend: { flexDirection: "row", gap: 16, marginBottom: SPACING.md },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },

  // ── Bus body ──
  busBody: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  driverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  steeringWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  doorLabel: {},
  driverLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontWeight: "600" },
  seatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
    gap: 8,
  },
  aisle: { width: 20 },
  seat: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + "18",
    borderWidth: 1.5,
    borderColor: COLORS.primary + "60",
    alignItems: "center",
    justifyContent: "center",
  },
  seatTaken: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.borderStrong || "#ccc",
  },
  seatSelected: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
    ...SHADOWS.soft,
  },
  seatNum: { ...TYPOGRAPHY.caption, color: COLORS.primary, fontWeight: "700" },
  seatNumTaken: { color: COLORS.gray },
  seatNumSelected: { color: COLORS.white },

  // ── Bottom bar ──
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  bottomBarInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  bottomBarLabel: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: "600" },
  bottomBarFare: { ...TYPOGRAPHY.subtitle, color: COLORS.primary, fontWeight: "700" },
  bookBtn: { width: "100%" },

  // ── Success ──
  successScroll: { paddingBottom: 40 },
  successBanner: {
    alignItems: "center",
    paddingVertical: SPACING.xxl || 48,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  successTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.white,
    fontSize: 22,
    marginTop: 12,
    fontWeight: "800",
  },
  successSub: { ...TYPOGRAPHY.body, color: COLORS.white + "CC", marginTop: 4 },
  successFare: { ...TYPOGRAPHY.subtitle, color: COLORS.white, marginTop: 8, fontWeight: "700" },
  qrSection: {
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  qrTitle: { ...TYPOGRAPHY.subtitle, color: COLORS.text, marginBottom: 4 },
  bookingIdText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: 8 },
  qrSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  actionsSection: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },

  // ── Existing booking card ──
  existingBookingSection: {
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  existingBanner: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  existingBannerRow: { flexDirection: "row", alignItems: "center" },
  existingBannerTitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
  },
  existingBannerSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white + "CC",
    marginTop: 2,
  },
  existingBannerFare: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.white,
    fontWeight: "800",
  },
  existingQrWrap: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  existingQrLabel: { ...TYPOGRAPHY.subtitle, color: COLORS.text, marginBottom: 4 },
  existingQrId: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  existingQrHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  cancelBookingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.error + "12",
    borderTopWidth: 1,
    borderTopColor: COLORS.error + "30",
  },
  cancelBookingBtnText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    fontWeight: "700",
  },
  verifiedBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.success + "10",
    borderTopWidth: 1,
    borderTopColor: COLORS.success + "30",
  },
  verifiedBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: "700",
  },
});
