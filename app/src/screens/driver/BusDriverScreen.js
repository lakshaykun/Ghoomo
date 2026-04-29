import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { logoutUser } from "../../store/slices/authSlice";
import { fetchBusRoutes } from "../../store/slices/busRoutesSlice";
import Card from "../../components/common/Card";
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from "../../constants";

export default function BusDriverScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const routes = useSelector((state) => state.busRoutes.routes || []);
  const loading = useSelector((state) => state.busRoutes.loading);

  useEffect(() => {
    dispatch(fetchBusRoutes());
  }, [dispatch]);

  const assignedRoutes = useMemo(() => {
    return routes.filter((r) => r.driver_user_id === user?.id || r.driverUserId === user?.id);
  }, [routes, user?.id]);

  const renderRouteItem = ({ item }) => (
    <Card elevated style={styles.routeCard}>
      <TouchableOpacity 
        style={styles.routeTouchable}
        onPress={() => navigation.navigate("BusDriverRoute", { routeId: item.id })}
      >
        <View style={styles.routeIconContainer}>
          <Ionicons name="bus" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.routeInfo}>
          <Text style={styles.routeName}>{item.name}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.timeText}>{item.departureTime} - {item.arrivalTime}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{item.stops?.length || 0} stops</Text>
            <View style={styles.dot} />
            <Text style={styles.metaText}>{item.totalSeats} seats</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.borderStrong} />
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome Pilot,</Text>
          <Text style={styles.driverName}>{user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logoutUser())}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Your Assigned Routes</Text>
        {loading ? (
          <View style={styles.centered}><Text>Loading routes...</Text></View>
        ) : assignedRoutes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={60} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Routes Assigned</Text>
            <Text style={styles.emptySub}>You haven't been assigned to any bus routes yet.</Text>
          </View>
        ) : (
          <FlatList
            data={assignedRoutes}
            renderItem={renderRouteItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </div>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  welcomeText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  driverName: { ...TYPOGRAPHY.subtitle, fontSize: 20, color: COLORS.text },
  logoutBtn: { padding: 8 },
  content: { flex: 1, padding: SPACING.lg },
  sectionTitle: { ...TYPOGRAPHY.subtitle, color: COLORS.text, marginBottom: SPACING.md },
  list: { paddingBottom: SPACING.xl },
  routeCard: { marginBottom: SPACING.md, padding: 0, overflow: "hidden" },
  routeTouchable: { flexDirection: "row", alignItems: "center", padding: SPACING.md },
  routeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  routeInfo: { flex: 1 },
  routeName: { ...TYPOGRAPHY.body, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  timeRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  timeText: { fontSize: 13, color: COLORS.textSecondary, marginLeft: 4 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.gray, marginHorizontal: 6 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 60 },
  emptyTitle: { ...TYPOGRAPHY.subtitle, color: COLORS.text, marginTop: 16 },
  emptySub: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, paddingHorizontal: 20 },
});
