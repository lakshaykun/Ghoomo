import React, { useCallback, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import {
  fetchSharedRides,
  joinSharedRideRequest,
  stopSharedRideRequest,
} from "../../store/slices/sharedRidesSlice";

export default function SharedRidesScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { myRequests, availableRequests, loading } = useSelector(
    (state) => state.sharedRides
  );
  const canManageRide = ["driver", "admin"].includes(
    String(user?.role || "").toLowerCase()
  );

  const load = useCallback(() => {
    if (user?.id) dispatch(fetchSharedRides(user.id)).catch(() => {});
  }, [dispatch, user?.id]);

  useEffect(() => {
    load();
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, [load]);

  const handleJoin = (request) => {
    Alert.alert(
      "Join Shared Ride",
      `Join ${request.ownerName}'s ${request.rideType} from ${request.pickup?.name} to ${request.drop?.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Join",
          onPress: () =>
            dispatch(joinSharedRideRequest(request.id, user.id)).catch((err) =>
              Alert.alert("Unable to Join", err.message)
            ),
        },
      ]
    );
  };

  const handleStop = (request) => {
    if (!canManageRide) {
      Alert.alert(
        "Not Allowed",
        "Only driver/admin accounts can cancel shared ride requests."
      );
      return;
    }
    Alert.alert("Cancel Shared Ride", "This ride will be cancelled for all participants.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel Ride",
        style: "destructive",
        onPress: () =>
          dispatch(stopSharedRideRequest(request.id, user.id, user?.role)).catch((err) =>
            Alert.alert("Unable to Cancel", err.message)
          ),
      },
    ]);
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
          <Text style={styles.title}>Shared Rides</Text>
          <Text style={styles.subtitle}>
            Schedule a shared ride to split costs with other riders.
          </Text>
        </View>

        {/* ── Your Requests ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Requests</Text>
          {myRequests.length > 0 ? (
            myRequests.map((r) => (
              <Card key={r.id} elevated style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBadge}>
                    <Ionicons name="people" size={18} color={COLORS.success} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {r.rideType?.toUpperCase()} · Shared
                    </Text>
                    <Text style={styles.cardRoute} numberOfLines={2}>
                      {r.pickup?.name} → {r.drop?.name}
                    </Text>
                  </View>
                  <Badge status={r.status} />
                </View>

                {r.scheduledAt && (
                  <View style={styles.scheduledRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.scheduledText}>{formatScheduled(r.scheduledAt)}</Text>
                  </View>
                )}

                <Text style={styles.metaText}>
                  {r.acceptedCount} / {r.requestedSeats} seats filled ·{" "}
                  {r.remainingSeats} remaining
                </Text>

                <View style={styles.cardActions}>
                  {canManageRide ? (
                    <Button
                      title="Cancel Ride"
                      onPress={() => handleStop(r)}
                      variant="danger"
                      size="sm"
                    />
                  ) : (
                    <Text style={styles.hintText}>
                      Waiting for driver to accept
                    </Text>
                  )}
                </View>
              </Card>
            ))
          ) : (
            <Card elevated style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={36} color={COLORS.borderStrong} />
              <Text style={styles.emptyTitle}>No active shared requests</Text>
              <Text style={styles.emptyText}>
                Enable "Share Ride" when booking a cab or auto to post a request.
              </Text>
            </Card>
          )}
        </View>

        {/* ── Available Nearby ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available to Join</Text>
          {availableRequests.length > 0 ? (
            availableRequests.map((r) => (
              <Card key={r.id} elevated style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBadge, { backgroundColor: COLORS.primary + "15" }]}>
                    <Ionicons name="people-circle" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {r.ownerName}'s {r.rideType?.toUpperCase()}
                    </Text>
                    <Text style={styles.cardRoute} numberOfLines={2}>
                      {r.pickup?.name} → {r.drop?.name}
                    </Text>
                  </View>
                  <Badge status={r.status} />
                </View>

                {r.scheduledAt && (
                  <View style={styles.scheduledRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.scheduledText}>{formatScheduled(r.scheduledAt)}</Text>
                  </View>
                )}

                <Text style={styles.metaText}>
                  {r.remainingSeats} seat{r.remainingSeats !== 1 ? "s" : ""} available ·{" "}
                  {r.acceptedCount} already joined
                </Text>

                <Button
                  title="Join Ride"
                  onPress={() => handleJoin(r)}
                  variant="success"
                  size="sm"
                  style={styles.joinBtn}
                />
              </Card>
            ))
          ) : (
            <Card elevated style={styles.emptyCard}>
              <Ionicons name="search-outline" size={36} color={COLORS.borderStrong} />
              <Text style={styles.emptyTitle}>No rides to join yet</Text>
              <Text style={styles.emptyText}>
                Shared ride requests from other riders will appear here.
              </Text>
            </Card>
          )}
        </View>

        <View style={{ height: SPACING.xxl * 2 }} />
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
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  card: { marginBottom: SPACING.sm, padding: SPACING.md },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 8 },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.success + "15",
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 3 },
  cardRoute: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
  scheduledRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  scheduledText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  metaText: { fontSize: 12, fontWeight: "700", color: COLORS.primary, marginBottom: 12 },
  cardActions: { marginTop: 4 },
  joinBtn: { marginTop: 8 },
  hintText: { fontSize: 12, color: COLORS.textSecondary, fontStyle: "italic" },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
    marginBottom: SPACING.sm,
  },
  emptyTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  emptyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: SPACING.md,
  },
});