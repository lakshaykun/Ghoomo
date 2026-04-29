import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from "../../constants";
import { fetchBusRoutes } from "../../store/slices/busRoutesSlice";
import Card from "../../components/common/Card";

export default function BusTrackTab({ navigation }) {
  const dispatch = useDispatch();
  const routes = useSelector((state) => state.busRoutes.routes || []);

  useEffect(() => {
    dispatch(fetchBusRoutes());
  }, [dispatch]);

  const renderRouteCard = ({ item }) => {
    return (
      <Card elevated style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>{item.name}</Text>
            
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>{item.departureTime}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>{item.daysOfOperation || "Daily"}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.trackBtn}
            onPress={() => navigation.navigate("BusLiveTracking", { route: item })}
          >
            <Text style={styles.trackBtnText}>Track</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track Bus</Text>
        <Text style={styles.headerSub}>Live location of active bus routes</Text>
      </View>

      <FlatList
        data={routes}
        renderItem={renderRouteCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="locate-outline" size={60} color={COLORS.gray} />
            <Text style={styles.emptyText}>No routes available to track</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    ...TYPOGRAPHY.title,
    fontSize: 24,
    color: COLORS.text,
  },
  headerSub: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  list: {
    padding: SPACING.md,
  },
  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
    fontSize: 18,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  trackBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  trackBtnText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
});
