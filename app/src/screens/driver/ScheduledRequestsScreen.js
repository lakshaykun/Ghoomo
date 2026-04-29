import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchDriverDashboard } from "../../store/slices/driverSlice";
import { api } from "../../services/api";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants";

export default function ScheduledRequestsScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { dashboard, loading } = useSelector((state) => state.driver);
  const scheduledRides = dashboard?.scheduledRides || [];
  const driverUserId = user?.id;

  const [accepting, setAccepting] = useState(null); // rideId being accepted

  const load = useCallback(() => {
    if (driverUserId) {
      dispatch(fetchDriverDashboard(driverUserId)).catch(() => {});
    }
  }, [dispatch, driverUserId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const handleAcceptScheduled = (ride) => {
    const passengerInfo =
      ride.totalPassengers > 0
        ? `\n\nPassengers: ${ride.totalPassengers}${ride.maxPassengers > 0 ? ` / ${ride.maxPassengers}` : ""}`
        : "";

    const scheduledInfo = ride.scheduledAt
      ? `\nScheduled: ${new Date(ride.scheduledAt).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })}`
      : "";

    Alert.alert(
      "Accept Scheduled Ride",
      `From: ${ride.pickup?.name}\nTo: ${ride.drop?.name}${scheduledInfo}${passengerInfo}\n\nFare: ₹${Number(ride.fare || 0).toFixed(0)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () => doAccept(ride, false),
        },
      ]
    );
  };

  const doAccept = async (ride, forceAcceptPartial) => {
    setAccepting(ride.id);
    try {
      await api.acceptScheduledRide(ride.id, { forceAcceptPartial });
      load();
      Alert.alert("✓ Accepted", "Scheduled ride accepted successfully!");
    } catch (err) {
      if (err?.message?.includes("PARTIAL_ACCEPTANCE_REQUIRED") || err?.message?.includes("exceeds your vehicle capacity")) {
        Alert.alert(
          "Passenger Count Warning",
          err.message + "\n\nDo you want to accept anyway?",
          [
            { text: "No", style: "cancel" },
            { text: "Accept Anyway", onPress: () => doAccept(ride, true) },
          ]
        );
      } else {
        Alert.alert("Accept Failed", err.message || "Unable to accept this ride.");
      }
    } finally {
      setAccepting(null);
    }
  };

  function formatScheduled(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Scheduled Rides</Text>
          <Text style={styles.subtitle}>
            Accept upcoming shared or solo rides before they expire.
          </Text>
        </View>

        <View style={styles.section}>
          {loading && !dashboard ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : scheduledRides.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.borderStrong} />
              <Text style={styles.emptyTitle}>No scheduled rides</Text>
              <Text style={styles.emptyText}>
                Upcoming rides posted by passengers will appear here.
              </Text>
            </Card>
          ) : (
            scheduledRides.map((ride) => (
              <Card key={ride.id} elevated style={styles.rideCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickupName} numberOfLines={1}>
                      {ride.pickup?.name || "Pickup"}
                    </Text>
                    <Text style={styles.dropName} numberOfLines={1}>
                      → {ride.drop?.name || "Drop"}
                    </Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={styles.fareText}>
                      ₹{Number(ride.fare || 0).toFixed(0)}
                    </Text>
                    <Badge status={ride.status} />
                  </View>
                </View>

                {/* Scheduled time */}
                {ride.scheduledAt ? (
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.timeText}>{formatScheduled(ride.scheduledAt)}</Text>
                  </View>
                ) : null}

                {/* Ride type & passengers */}
                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Ionicons
                      name={ride.rideType === "cab" ? "car" : "car-sport"}
                      size={13}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.metaText}>
                      {String(ride.rideType || "auto").toUpperCase()}
                    </Text>
                  </View>
                  {ride.isShare || ride.isScheduled ? (
                    <View style={[styles.metaChip, { backgroundColor: COLORS.primary + "15" }]}>
                      <Ionicons name="people" size={13} color={COLORS.primary} />
                      <Text style={[styles.metaText, { color: COLORS.primary }]}>
                        {ride.totalPassengers > 0
                          ? `${ride.totalPassengers} passenger${ride.totalPassengers !== 1 ? "s" : ""}`
                          : ride.isShare
                          ? "Shared"
                          : "Scheduled"}
                        {ride.maxPassengers > 0 ? ` / ${ride.maxPassengers} max` : ""}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Button
                  title={accepting === ride.id ? "Accepting…" : "Accept Ride"}
                  onPress={() => handleAcceptScheduled(ride)}
                  disabled={accepting === ride.id}
                  variant="primary"
                  style={styles.acceptBtn}
                />
              </Card>
            ))
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
    marginBottom: SPACING.sm,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  emptyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: SPACING.md,
  },
  rideCard: { marginBottom: SPACING.md },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md, marginBottom: SPACING.sm },
  pickupName: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  dropName: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  rightCol: { alignItems: "flex-end", gap: 6 },
  fareText: { fontSize: 18, fontWeight: "900", color: COLORS.primary },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary + "12",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: SPACING.sm,
  },
  timeText: { fontSize: 13, fontWeight: "700", color: COLORS.primary, flex: 1 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: SPACING.md },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaText: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  acceptBtn: { marginTop: 4 },
});
