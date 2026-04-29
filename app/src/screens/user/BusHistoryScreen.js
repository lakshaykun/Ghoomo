import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from "../../constants";
import { fetchBusBookings } from "../../store/slices/bookingSlice";
import Card from "../../components/common/Card";
import QRDisplay from "../../components/common/QRDisplay";
import Button from "../../components/common/Button";

export default function BusHistoryScreen({ navigation }) {
  const dispatch = useDispatch();
  const busBookings = useSelector((state) => state.booking.busBookings);
  const user = useSelector((state) => state.auth.user);
  const [viewingQR, setViewingQR] = React.useState(null);

  // Filter only user's bookings and sort by date (newest first)
  const history = React.useMemo(() => {
    return busBookings
      .filter((b) => b.userId === user?.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [busBookings, user?.id]);

  useEffect(() => {
    dispatch(fetchBusBookings());
  }, [dispatch]);

  const renderItem = ({ item }) => {
    const isCompleted = item.verified || item.status === "completed";
    
    return (
      <Card elevated style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="bus" size={24} color={COLORS.primary} />
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.row}>
              <Text style={styles.routeName}>{item.routeName || "Bus Route"}</Text>
              <View style={[styles.statusBadge, isCompleted && styles.statusBadgeCompleted]}>
                <Text style={[styles.statusText, isCompleted && styles.statusTextCompleted]}>
                  {isCompleted ? "Completed" : item.status === "cancelled" ? "Cancelled" : "Confirmed"}
                </Text>
              </View>
            </View>
            
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>
                {new Date(item.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
              <View style={styles.dot} />
              <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <View style={styles.seatRow}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.seatLabel}>
                  {item.isWaiting ? "Waitlist" : "Seat"}
                </Text>
                <Text style={styles.seatValue}>
                  {item.isWaiting ? `WL ${item.waitlistPosition}` : item.seatNumber}
                </Text>
              </View>
              
              {!isCompleted && item.status !== "cancelled" && (
                <TouchableOpacity 
                  style={styles.qrBtn} 
                  onPress={() => setViewingQR(item)}
                >
                  <Ionicons name="qr-code" size={16} color={COLORS.primary} />
                  <Text style={styles.qrBtnText}>View QR</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Booking History</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.gray} />
          </View>
          <Text style={styles.emptyTitle}>No Bookings Found</Text>
          <Text style={styles.emptySub}>Your bus booking history will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* QR Modal */}
      <Modal
        visible={!!viewingQR}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewingQR(null)}
      >
        <View style={styles.modalOverlay}>
          <Card elevated style={styles.qrModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Boarding Pass</Text>
              <TouchableOpacity onPress={() => setViewingQR(null)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrContainer}>
              {viewingQR && (
                <QRDisplay
                  data={{
                    bookingId: viewingQR.id,
                    type: "BUS",
                    busId: viewingQR.routeId,
                    seatNo: viewingQR.seatNumber,
                    userId: user?.id,
                    ts: Date.now()
                  }}
                  size={200}
                />
              )}
            </View>

            <View style={styles.modalInfo}>
              <Text style={styles.modalRouteName}>{viewingQR?.routeName}</Text>
              <Text style={styles.modalSeatInfo}>
                {viewingQR?.isWaiting ? "Waitlist" : "Seat"}: {viewingQR?.isWaiting ? `WL ${viewingQR.waitlistPosition}` : viewingQR?.seatNumber}
              </Text>
            </View>

            <Button title="Close" onPress={() => setViewingQR(null)} />
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
  },
  list: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  card: {
    marginVertical: 0,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  infoContainer: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  routeName: {
    ...TYPOGRAPHY.body,
    fontWeight: "700",
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary + "15",
  },
  statusBadgeCompleted: {
    backgroundColor: COLORS.success + "15",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  statusTextCompleted: {
    color: COLORS.success,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.gray,
    marginHorizontal: 8,
  },
  seatRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  seatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  seatValue: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySub: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  qrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + "10",
  },
  qrBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  qrModalCard: {
    width: "100%",
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  modalInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalRouteName: {
    ...TYPOGRAPHY.body,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  modalSeatInfo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});
