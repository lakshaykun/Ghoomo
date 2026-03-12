import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { logoutUser } from "../../store/slices/authSlice";
import { fetchBusRoutes } from "../../store/slices/busRoutesSlice";
import { verifyBusTicket } from "../../store/slices/bookingSlice";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import { COLORS, SPACING } from "../../constants";
import { getBookingWindow } from "../../utils/bus";
import { sendLocalNotification } from "../../services/notifications";

export default function BusDriverRouteScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const busBookings = useSelector(s => s.booking.busBookings);
  const liveRoutes = useSelector((state) => state.busRoutes.routes);
  const routes = liveRoutes;
  const routeId = route?.params?.routeId;
  const [scanResult, setScanResult] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    dispatch(fetchBusRoutes()).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => {
      const aw = getBookingWindow(a, new Date());
      const bw = getBookingWindow(b, new Date());
      return aw.departure.getTime() - bw.departure.getTime();
    });
  }, [routes]);

  const selectedRoute = sortedRoutes.find(r => r.id === routeId) || null;

  if (!selectedRoute) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route not found</Text>
          <Text style={styles.emptySub}>Please choose a bus route to continue.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
            <Text style={styles.backText}>Back to route selection</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const routeBookings = busBookings.filter(b => b.routeId === selectedRoute.id && b.status !== "cancelled");
  const verifiedCount = routeBookings.filter(b => b.verified).length;
  const todayPassengers = routeBookings.length;

  const verifyQR = (qrString) => {
    try {
      let data;
      if (typeof qrString === "string") {
        // If pure bookingId (no JSON), wrap it so the matcher below still works.
        if (!qrString.trim().startsWith("{")) {
          data = { bookingId: qrString.trim() };
        } else {
          data = JSON.parse(qrString);
        }
      } else {
        data = qrString;
      }
      if (data.busId && data.busId !== selectedRoute.id) {
        setScanResult({ valid: false, message: `This QR belongs to another route. Select ${data.busId} to verify it.` });
        return;
      }

      const booking = busBookings.find((b) => {
        if (data.bookingId && b.id === data.bookingId && b.status !== "cancelled") {
          return true;
        }
        return (
          data.busId &&
          b.routeId === data.busId &&
          b.userId === data.userId &&
          b.seatNumber === data.seatNo &&
          b.id === data.bookingId &&
          b.status !== "cancelled"
        );
      });
      if (booking) {
        if (booking.isWaiting) {
          setScanResult({ valid: false, message: "This passenger is still on the waiting list and cannot board yet." });
          return;
        }
        if (booking.verified) {
          setScanResult({ valid: false, message: "Ticket already verified for boarding." });
          return;
        }

        dispatch(verifyBusTicket({ bookingId: booking.id, verifiedBy: user?.id || "bus_driver" }));
        sendLocalNotification({
          key: `ticket-verified-${booking.id}`,
          title: "Ticket verified",
          body: `${booking.userName} is cleared to board ${selectedRoute.name}.`,
          data: { bookingId: booking.id, routeId: selectedRoute.id, type: "bus-driver" },
        }).catch(() => {});
        setScanResult({
          valid: true,
          booking: { ...booking, verified: true, verifiedBy: user?.id || "bus_driver" },
          data,
          message: "Ticket verified successfully.",
        });
      } else {
        setScanResult({ valid: false, message: "Invalid or expired QR code" });
      }
    } catch {
      setScanResult({ valid: false, message: "Could not parse QR code" });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[COLORS.success, "#059669"]} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
              <View>
                <Text style={styles.busDriverName}>{user?.name}</Text>
                <Text style={styles.routeLabel}>{selectedRoute.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => dispatch(logoutUser())} style={styles.logoutBtn}>
              <Ionicons name="log-out" size={22} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statVal}>{todayPassengers}</Text><Text style={styles.statLabel}>Passengers</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.stat}><Text style={styles.statVal}>{verifiedCount}</Text><Text style={styles.statLabel}>Verified</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.stat}><Text style={styles.statVal}>{selectedRoute.totalSeats - routeBookings.length}</Text><Text style={styles.statLabel}>Empty Seats</Text></View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Details</Text>
          <Card elevated>
            <View style={styles.routeStopsRow}>
              {selectedRoute.stops.map((stop, i) => (
                <View key={`${stop}-${i}`} style={styles.stopRow}>
                  <View style={[styles.stopDot, i === 0 && { backgroundColor: COLORS.success }, i === selectedRoute.stops.length - 1 && { backgroundColor: COLORS.error }]} />
                  <Text style={styles.stopName}>{stop}</Text>
                  {i < selectedRoute.stops.length - 1 && <View style={styles.stopLine} />}
                </View>
              ))}
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verify Passenger Ticket</Text>
          <Card elevated>
            <Text style={styles.scanInstructions}>
              Selected route: {selectedRoute.name}. Scan the QR code to verify instantly.
            </Text>
            {permission && permission.granted ? (
              <View style={styles.cameraWrap}>
                <CameraView
                  onBarcodeScanned={scanned ? undefined : ({ data }) => {
                    setScanned(true);
                    verifyQR(data);
                  }}
                  style={StyleSheet.absoluteFillObject}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                />
                <View style={styles.cameraOverlay}>
                  <View style={styles.scanFrame}>
                    <Ionicons name="scan" size={24} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.scanFrameText}>Align QR within the frame</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.permissionCard}>
                <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
                <Text style={styles.permissionText}>Camera permission is required to scan tickets.</Text>
              </View>
            )}
            {scanned ? (
              <TouchableOpacity
                style={styles.scanAgainBtn}
                onPress={() => {
                  setScanned(false);
                  setScanResult(null);
                }}
              >
                <Ionicons name="refresh" size={16} color={COLORS.primary} />
                <Text style={styles.scanAgainText}>Scan Next Passenger</Text>
              </TouchableOpacity>
            ) : null}

            {scanResult && (
              <View style={[styles.scanResult, { backgroundColor: scanResult.valid ? COLORS.success + "15" : COLORS.error + "15" }]}
              >
                <Ionicons name={scanResult.valid ? "checkmark-circle" : "close-circle"} size={28} color={scanResult.valid ? COLORS.success : COLORS.error} />
                {scanResult.valid ? (
                  <View style={styles.scanResultInfo}>
                    <Text style={[styles.scanResultTitle, { color: COLORS.success }]}>Ticket Verified</Text>
                    <Text style={styles.scanResultText}>Seat: {scanResult.booking.seatNumber}</Text>
                    <Text style={styles.scanResultText}>Passenger: {scanResult.booking.userName}</Text>
                    <Text style={styles.scanResultText}>{scanResult.message}</Text>
                    <Badge status="completed" label="Verified" />
                  </View>
                ) : (
                  <View style={styles.scanResultInfo}>
                    <Text style={[styles.scanResultTitle, { color: COLORS.error }]}>Invalid!</Text>
                    <Text style={styles.scanResultText}>{scanResult.message}</Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passenger List ({routeBookings.length})</Text>
          {routeBookings.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="people" size={32} color={COLORS.border} />
              <Text style={styles.emptyText}>No bookings yet for this route</Text>
            </Card>
          ) : (
            routeBookings.map(booking => (
              <Card key={booking.id} style={styles.passengerCard}>
                <View style={styles.passengerRow}>
                  <View style={styles.seatBadge}>
                    <Text style={styles.seatBadgeText}>{booking.seatNumber}</Text>
                  </View>
                  <View style={styles.passengerInfo}>
                    <Text style={styles.passengerName}>{booking.userName}</Text>
                    <Text style={styles.passengerStatus}>
                      {booking.isWaiting
                        ? `WL ${booking.waitlistPosition}`
                        : `Seat ${booking.seatNumber}`}
                      {booking.verified ? " • Verified" : ""}
                    </Text>
                  </View>
                  <Badge
                    status={booking.verified ? "completed" : booking.isWaiting ? "waiting" : "accepted"}
                    label={booking.verified ? "Verified" : booking.isWaiting ? "Waiting" : "Pending Scan"}
                  />
                </View>
              </Card>
            ))
          )}
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.xl },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SPACING.md },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  busDriverName: { fontSize: 22, fontWeight: "800", color: COLORS.white },
  routeLabel: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  logoutBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20 },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 18, fontWeight: "900", color: COLORS.white },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.sm },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  backText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  routeStopsRow: {},
  stopRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  stopDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, marginRight: 12 },
  stopName: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  stopLine: {},
  scanInstructions: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 },
  cameraWrap: { height: 210, borderRadius: 16, overflow: "hidden", backgroundColor: COLORS.black, marginBottom: 12 },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  scanFrame: {
    width: 170,
    height: 170,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  scanFrameText: { fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: "600" },
  permissionCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF7ED", borderRadius: 12, padding: 12, marginBottom: 12 },
  permissionText: { flex: 1, fontSize: 12, color: "#9A3412", fontWeight: "600" },
  scanAgainBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, marginBottom: 12 },
  scanAgainText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  scanResult: { borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  scanResultInfo: { flex: 1 },
  scanResultTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  scanResultText: { fontSize: 13, color: COLORS.text, marginBottom: 4 },
  passengerCard: { marginBottom: SPACING.sm },
  passengerRow: { flexDirection: "row", alignItems: "center" },
  seatBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  seatBadgeText: { fontSize: 14, fontWeight: "900", color: COLORS.white },
  passengerInfo: { flex: 1, marginLeft: 12 },
  passengerName: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  passengerStatus: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  emptyCard: { alignItems: "center", paddingVertical: SPACING.xl },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 10 },
});
