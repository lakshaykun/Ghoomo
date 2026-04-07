import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING } from "../../constants";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { fetchSharedRides, joinSharedRideRequest, stopSharedRideRequest } from "../../store/slices/sharedRidesSlice";

export default function SharedRidesScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const activeBooking = useSelector((state) => state.booking.activeBooking);
  const { myRequests, availableRequests, loading } = useSelector((state) => state.sharedRides);
  const canCloseSharedRide = ["driver", "admin", "bus_driver"].includes(String(user?.role || "").toLowerCase());

  useEffect(() => {
    if (!user?.id) return undefined;

    dispatch(fetchSharedRides(user.id)).catch(() => {});
    const intervalId = setInterval(() => {
      dispatch(fetchSharedRides(user.id)).catch(() => {});
    }, 10000);

    return () => clearInterval(intervalId);
  }, [dispatch, user?.id]);

  const handleJoinSharedRide = (requestId) => {
    dispatch(joinSharedRideRequest(requestId, user.id)).catch((error) =>
      Alert.alert("Unable to Join", error.message)
    );
  };

  const handleStopSharedRide = (requestId) => {
    if (!canCloseSharedRide) {
      Alert.alert("Not Allowed", "Only driver/admin accounts can close shared ride requests in the current backend.");
      return;
    }

    Alert.alert("Stop Shared Request", "This shared ride request will be removed from the list.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Stop",
        style: "destructive",
        onPress: () =>
          dispatch(stopSharedRideRequest(requestId, user.id, user?.role)).catch((error) =>
            Alert.alert("Unable to Stop", error.message)
          ),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Shared Ride Requests</Text>
          <Text style={styles.subtitle}>Post, track, and accept shared rides in one place.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Requests</Text>
          {myRequests.length > 0 ? myRequests.map((request) => (
            <Card key={request.id} elevated style={styles.sharedCard}>
              <View style={styles.sharedHeader}>
                <View style={styles.sharedBadge}>
                  <Ionicons name="people" size={18} color={COLORS.success} />
                </View>
                <View style={styles.sharedInfo}>
                  <Text style={styles.sharedTitle}>Your shared {request.rideType}</Text>
                  <Text style={styles.sharedRoute} numberOfLines={2}>{request.pickup?.name} to {request.drop?.name}</Text>
                </View>
              </View>
              <Text style={styles.sharedMeta}>
                {request.acceptedCount}/{request.requestedSeats} joined • {request.remainingSeats} seat{request.remainingSeats === 1 ? "" : "s"} left
              </Text>
              {canCloseSharedRide ? (
                <Button title="Stop Request" onPress={() => handleStopSharedRide(request.id)} variant="danger" variant2="outline" />
              ) : (
                <Text style={styles.sharedHint}>Stop action is restricted to driver/admin by backend policy.</Text>
              )}
            </Card>
          )) : (
            <Card elevated style={styles.sharedEmptyCard}>
              <Text style={styles.sharedEmptyTitle}>No active shared request</Text>
              <Text style={styles.sharedEmptyText}>Enable Share Ride while booking a cab or auto to create a request.</Text>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Nearby</Text>
          {availableRequests.length > 0 ? availableRequests.map((request) => (
            <Card key={request.id} elevated style={styles.sharedCard}>
              <View style={styles.sharedHeader}>
                <View style={[styles.sharedBadge, { backgroundColor: COLORS.primary + "15" }]}>
                  <Ionicons name="people-circle" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.sharedInfo}>
                  <Text style={styles.sharedTitle}>{request.ownerName}'s shared {request.rideType}</Text>
                  <Text style={styles.sharedRoute} numberOfLines={2}>{request.pickup?.name} to {request.drop?.name}</Text>
                </View>
              </View>
              <Text style={styles.sharedMeta}>
                {request.remainingSeats} seat{request.remainingSeats === 1 ? "" : "s"} available • {request.acceptedCount} joined
              </Text>
              <Button
                title="Accept Shared Request"
                onPress={() => handleJoinSharedRide(request.id)}
                variant="success"
                disabled={Boolean(activeBooking)}
              />
            </Card>
          )) : (
            <Card elevated style={styles.sharedEmptyCard}>
              <Text style={styles.sharedEmptyTitle}>No nearby shared rides yet</Text>
              <Text style={styles.sharedEmptyText}>When other riders post shared requests, they will appear here for one-tap acceptance.</Text>
            </Card>
          )}
        </View>

        {loading ? <Text style={styles.loadingNote}>Refreshing shared ride requests...</Text> : null}
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  header: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.md },
  sharedCard: { marginBottom: SPACING.sm },
  sharedHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  sharedBadge: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.success + "15" },
  sharedInfo: { flex: 1 },
  sharedTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  sharedRoute: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  sharedMeta: { fontSize: 12, fontWeight: "700", color: COLORS.primary, marginBottom: 12 },
  sharedHint: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  sharedEmptyCard: { marginBottom: SPACING.sm },
  sharedEmptyTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 6 },
  sharedEmptyText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  loadingNote: { marginTop: 8, marginHorizontal: SPACING.md, fontSize: 12, color: COLORS.textSecondary, fontWeight: "700" },
});