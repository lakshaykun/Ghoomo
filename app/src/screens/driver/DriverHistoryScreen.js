import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/common/Header";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import { COLORS, SPACING } from "../../constants";

export default function DriverHistoryScreen() {
  const user = useSelector((state) => state.auth.user);
  const driverDashboard = useSelector((state) => state.driver.dashboard);
  const bookingHistory = useSelector((state) => state.booking.bookingHistory);

  const dashboardHistory = driverDashboard?.completedRides || [];
  const fallbackHistory = useMemo(
    () =>
      bookingHistory.filter(
        (ride) =>
          ride.type !== "bus" &&
          (ride.driver?.id === user?.id || ride.driverId === user?.id)
      ),
    [bookingHistory, user?.id]
  );

  const history = dashboardHistory.length ? dashboardHistory : fallbackHistory;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Ride History" />
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time" size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyText}>Your completed rides will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card elevated style={styles.card}>
              <View style={styles.row}>
                <View style={styles.iconWrap}>
                  <Ionicons name="car" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.pickup?.name || "Pickup"} → {item.drop?.name || "Drop"}
                  </Text>
                  <Text style={styles.meta}>
                    {new Date(item.updatedAt || item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {" • "}
                    {item.distance} km • {item.durationMinutes} min
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.fare}>₹{item.fare}</Text>
                  <Badge status={item.status} />
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, gap: 12 },
  card: { marginBottom: 0 },
  row: { flexDirection: "row", alignItems: "center" },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, marginHorizontal: 12 },
  title: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  right: { alignItems: "flex-end", gap: 6 },
  fare: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
});
