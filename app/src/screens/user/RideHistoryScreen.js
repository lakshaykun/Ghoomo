
import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/common/Header";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import { COLORS, SPACING } from "../../constants";
import { fetchRideHistory } from "../../store/slices/bookingSlice";

const rideIcons = { bike: "bicycle", auto: "car-sport", cab: "car", bus: "bus" };
const rideColors = { bike: "#FF6B35", auto: "#F59E0B", cab: "#6C63FF", bus: "#10B981" };

export default function RideHistoryScreen({ navigation }) {
  const dispatch = useDispatch();
  const history = useSelector(s => s.booking.bookingHistory);
  const user = useSelector(s => s.auth.user);
  const myHistory = history.filter(b => b.userId === user?.id);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchRideHistory(user.id));
    }
  }, [dispatch, user?.id]);

  const renderItem = ({ item }) => {
    const rideType = item.rideType || item.type;
    const icon = rideIcons[rideType] || "car";
    const color = rideColors[rideType] || COLORS.primary;
    const isShare = item.isShare;

    return (
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => navigation.navigate("RideHistoryDetail", { ride: item })}
      >
        <Card elevated style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: color + "20" }]}>
              <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text style={styles.type}>{rideType?.charAt(0).toUpperCase() + rideType?.slice(1)}{isShare ? " (Shared)" : ""}</Text>
                <Badge status={item.status} />
              </View>
              {item.pickup && <Text style={styles.route} numberOfLines={1}>{item.pickup?.name || item.pickup} → {item.drop?.name || item.drop}</Text>}
              {item.routeId && <Text style={styles.route}>Bus Route • Seat {item.seatNumber}</Text>}
              
              {isShare && item.total_passengers > 0 && (
                <Text style={styles.participantsText}>
                  <Ionicons name="people" size={12} color={COLORS.textSecondary} /> {item.total_passengers} Participants
                </Text>
              )}

              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</Text>
            </View>
            {rideType === "bus" || item.routeId ? null : (
              <View style={styles.fareContainer}>
                <Text style={styles.fare}>₹{Number(item.final_fare_per_person || item.fare).toFixed(2)}</Text>
                {isShare && item.final_fare_per_person && (
                  <Text style={styles.perPersonLabel}>per person</Text>
                )}
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Ride History" onBack={() => navigation.goBack()} />
      {myHistory.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time" size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No rides yet</Text>
          <Text style={styles.emptyText}>Your ride history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={myHistory}
          renderItem={renderItem}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, marginHorizontal: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  type: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  route: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  date: { fontSize: 11, color: COLORS.gray },
  participantsText: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2, fontWeight: "600" },
  fareContainer: { alignItems: "flex-end" },
  fare: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  perPersonLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
});
