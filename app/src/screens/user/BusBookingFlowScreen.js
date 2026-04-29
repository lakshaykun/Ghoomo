import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createBusSeatBooking,
} from "../../store/slices/bookingSlice";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import QRDisplay from "../../components/common/QRDisplay";
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from "../../constants";
import { sendLocalNotification } from "../../services/notifications";
import {
  formatRelativeMinutes,
  formatShortTime,
  getBookingWindow,
  getRouteOccupancy,
} from "../../utils/bus";

const createBusBookingId = () => `bus_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export default function BusBookingFlowScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const { route: selectedRoute } = route.params;
  const user = useSelector((state) => state.auth.user);
  const busBookings = useSelector((state) => state.booking.busBookings);
  
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(intervalId);
  }, []);

  const occupancy = useMemo(() => getRouteOccupancy(selectedRoute, busBookings), [selectedRoute, busBookings]);
  const bookingWindow = useMemo(() => getBookingWindow(selectedRoute, now), [selectedRoute, now]);

  const handleBook = async () => {
    setLoading(true);
    try {
      // Auto-allocate first available seat if seats are available
      const seatToBook = occupancy.availableSeats[0] || null;
      
      const bookingId = createBusBookingId();
      const booking = await dispatch(
        createBusSeatBooking({
          bookingId,
          routeId: selectedRoute.id,
          userId: user.id,
          userName: user.name,
          seatNumber: seatToBook,
        })
      );

      sendLocalNotification({
        key: booking.isWaiting ? `bus-waiting-${booking.id}` : `bus-booking-${booking.id}`,
        title: booking.isWaiting ? "Added to waiting list" : "Bus seat confirmed",
        body: booking.isWaiting
          ? `${selectedRoute.name} waitlist position ${booking.waitlistPosition} is reserved.`
          : `${selectedRoute.name} seat ${booking.seatNumber} is booked for you.`,
        data: { bookingId: booking.id, routeId: selectedRoute.id, type: "bus" },
      }).catch(() => {});

      setBookingConfirmed(booking);
    } catch (error) {
      Alert.alert("Booking Failed", error.message || "Unable to book seat right now.");
    } finally {
      setLoading(false);
    }
  };

  if (bookingConfirmed) {
    const qrData = {
      bookingId: bookingConfirmed.id,
      type: "BUS",
      busId: selectedRoute.id,
      seatNo: bookingConfirmed.seatNumber,
      waitlistPosition: bookingConfirmed.waitlistPosition,
      userId: user.id,
      ts: Date.now(),
    };

    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.successScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.successHeader}>
            <LinearGradient colors={[COLORS.success, "#059669"]} style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={60} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.successTitle}>
              {bookingConfirmed.isWaiting ? "Waitlist Reserved" : "Seat Confirmed!"}
            </Text>
            <Text style={styles.successSub}>
              {bookingConfirmed.isWaiting 
                ? `You are at position ${bookingConfirmed.waitlistPosition} in the waitlist.`
                : `Your seat ${bookingConfirmed.seatNumber} is successfully booked.`}
            </Text>
          </View>

          <Card elevated style={styles.qrCard}>
            <Text style={styles.qrLabel}>Boarding Pass</Text>
            <View style={styles.qrContainer}>
              <QRDisplay
                data={qrData}
                size={200}
              />
            </View>
            <View style={styles.ticketDetails}>
              <View style={styles.ticketRow}>
                <View>
                  <Text style={styles.ticketLabel}>ROUTE</Text>
                  <Text style={styles.ticketValue}>{selectedRoute.name}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.ticketLabel}>{bookingConfirmed.isWaiting ? "WAITLIST" : "SEAT"}</Text>
                  <Text style={[styles.ticketValue, { color: COLORS.primary }]}>
                    {bookingConfirmed.isWaiting ? `WL ${bookingConfirmed.waitlistPosition}` : bookingConfirmed.seatNumber}
                  </Text>
                </View>
              </View>
              <View style={styles.ticketDivider} />
              <View style={styles.ticketRow}>
                <View>
                  <Text style={styles.ticketLabel}>TIME</Text>
                  <Text style={styles.ticketValue}>{selectedRoute.departureTime}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.ticketLabel}>BOOKING ID</Text>
                  <Text style={styles.ticketValue}>{bookingConfirmed.id.slice(-8).toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </Card>

          <View style={styles.actionContainer}>
            <Button 
              title="Go to History" 
              onPress={() => {
                navigation.popToTop();
                navigation.navigate("BusBooking", { screen: "History" });
              }} 
            />
            <TouchableOpacity 
              style={styles.textBtn} 
              onPress={() => navigation.popToTop()}
            >
              <Text style={styles.textBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Booking</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Route Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.busIconContainer}>
              <Ionicons name="bus" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryName}>{selectedRoute.name}</Text>
              <Text style={styles.summaryTime}>Departure at {selectedRoute.departureTime}</Text>
            </View>
            <Badge 
              status={bookingWindow.canBook ? "success" : "warning"} 
              label={bookingWindow.canBook ? "Available" : "Closed"} 
            />
          </View>
          
          <View style={styles.stopsLine}>
            {selectedRoute.stops.map((stop, i) => (
              <React.Fragment key={i}>
                <Text style={styles.stopText}>{stop}</Text>
                {i < selectedRoute.stops.length - 1 && (
                  <Ionicons name="chevron-forward" size={12} color={COLORS.borderStrong} />
                )}
              </React.Fragment>
            ))}
          </View>
        </Card>

        {/* Seat Information (No Selection) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {occupancy.availableSeatCount > 0 ? "Seat Allocation" : "Waitlist Booking"}
          </Text>
          <Text style={styles.sectionSub}>
            {occupancy.availableSeatCount > 0 
              ? `A seat will be automatically allocated to you from the ${occupancy.availableSeatCount} remaining seats.`
              : "All seats are occupied. You will be added to the waiting list."}
          </Text>

          {occupancy.availableSeatCount === 0 && (
            <View style={styles.waitlistInfo}>
              <Ionicons name="information-circle" size={24} color={COLORS.warning} />
              <Text style={styles.waitlistText}>
                Waitlist Position: <Text style={{ fontWeight: "700" }}>{occupancy.waitlistCount + 1}</Text>
              </Text>
            </View>
          )}
        </View>

        
        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title={occupancy.availableSeatCount > 0 ? "Confirm Booking" : "Join Waitlist"}
          onPress={handleBook}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { ...TYPOGRAPHY.subtitle, color: COLORS.text },
  content: { flex: 1, padding: SPACING.lg },
  
  summaryCard: { padding: SPACING.md, marginBottom: SPACING.xl },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  busIconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary + "10", alignItems: "center", justifyContent: "center" },
  summaryName: { ...TYPOGRAPHY.body, fontWeight: "700", color: COLORS.text },
  summaryTime: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  stopsLine: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  stopText: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary },
  
  section: { marginBottom: SPACING.xl },
  sectionTitle: { ...TYPOGRAPHY.subtitle, fontSize: 18, color: COLORS.text, marginBottom: 4 },
  sectionSub: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: 16 },
  
  waitlistInfo: { flexDirection: "row", alignItems: "center", gap: 12, padding: SPACING.md, backgroundColor: COLORS.warning + "10", borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.warning + "30" },
  waitlistText: { ...TYPOGRAPHY.body, color: COLORS.text },
  
  fareCard: { padding: SPACING.md },
  fareRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  fareLabel: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  fareValue: { ...TYPOGRAPHY.body, fontWeight: "600", color: COLORS.text },
  fareDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  
  footer: { padding: SPACING.lg, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOWS.card },
  
  successScroll: { padding: SPACING.lg, alignItems: "center" },
  successHeader: { alignItems: "center", marginBottom: 30, marginTop: 20 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 20, ...SHADOWS.soft },
  successTitle: { ...TYPOGRAPHY.title, color: COLORS.text, textAlign: "center" },
  successSub: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, paddingHorizontal: 20 },
  
  qrCard: { width: "100%", padding: SPACING.lg, alignItems: "center", borderRadius: RADIUS.xl },
  qrLabel: { ...TYPOGRAPHY.subtitle, marginBottom: 20, color: COLORS.text },
  qrContainer: { padding: 15, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: 25 },
  ticketDetails: { width: "100%", borderTopWidth: 2, borderTopColor: COLORS.border, borderStyle: "dashed", paddingTop: 20 },
  ticketRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  ticketLabel: { fontSize: 10, fontWeight: "800", color: COLORS.gray, marginBottom: 4 },
  ticketValue: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  ticketDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: 15 },
  
  actionContainer: { width: "100%", marginTop: 30, gap: 12 },
  textBtn: { padding: 12, alignItems: "center" },
  textBtnText: { color: COLORS.primary, fontWeight: "700" },
});
