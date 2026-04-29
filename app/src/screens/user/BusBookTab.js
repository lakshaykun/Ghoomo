import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from "../../constants";
import { fetchBusRoutes } from "../../store/slices/busRoutesSlice";
import { fetchBusBookings } from "../../store/slices/bookingSlice";
import { getRouteOccupancy, getBookingWindow, formatShortTime } from "../../utils/bus";
import Card from "../../components/common/Card";

export default function BusBookTab({ navigation }) {
  const dispatch = useDispatch();
  const routes = useSelector((state) => state.busRoutes.routes || []);
  const busBookings = useSelector((state) => state.booking.busBookings || []);
  const [now, setNow] = useState(new Date());
  const [expandedRouteId, setExpandedRouteId] = useState(null);

  useEffect(() => {
    dispatch(fetchBusRoutes());
    dispatch(fetchBusBookings());
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const renderBusCard = ({ item }) => {
    const occupancy = getRouteOccupancy(item, busBookings);
    const bookingWindow = getBookingWindow(item, now);
    
    return (
      <Card elevated style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.busInfo}>
            <Text style={styles.routeName}>{item.name}</Text>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.primary} />
              <Text style={styles.timeText}>{item.departureTime}</Text>
            </View>
            <View style={styles.seatInfo}>
              <Text style={[
                styles.seatsText, 
                occupancy.availableSeatCount < 5 && { color: COLORS.error }
              ]}>
                {occupancy.availableSeatCount} Seats Remaining
              </Text>
            </View>
          </View>
          
          {bookingWindow.canBook ? (
            <TouchableOpacity 
              style={styles.bookBtn}
              onPress={() => navigation.navigate("BusBookingFlow", { route: item })}
            >
              <Text style={styles.bookBtnText}>Book</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.closedContainer}>
              <Text style={styles.closedText}>
                Booking starts from {formatShortTime(bookingWindow.opensAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Schedule Toggle */}
        <TouchableOpacity 
          style={styles.scheduleToggle}
          onPress={() => setExpandedRouteId(expandedRouteId === item.id ? null : item.id)}
        >
          <Text style={styles.scheduleToggleText}>
            {expandedRouteId === item.id ? "Hide Schedule" : "View Schedule"}
          </Text>
          <Ionicons 
            name={expandedRouteId === item.id ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={COLORS.primary} 
          />
        </TouchableOpacity>

        {/* Detailed Schedule Content */}
        {expandedRouteId === item.id && (
          <View style={styles.scheduleDetails}>
            {(item.stopsDetailed || []).map((stop, index) => (
              <View key={index} style={styles.scheduleRow}>
                <View style={styles.scheduleTimeline}>
                  <View style={styles.scheduleDot} />
                  {index < item.stopsDetailed.length - 1 && <View style={styles.scheduleLine} />}
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleStopName}>{stop.stopName || stop.name}</Text>
                  <Text style={styles.scheduleTime}>{stop.arrivalTime || "TBD"}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Buses</Text>
        <Text style={styles.headerSub}>Select a route to book your seat</Text>
      </View>

      <FlatList
        data={routes}
        renderItem={renderBusCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bus-outline" size={60} color={COLORS.gray} />
            <Text style={styles.emptyText}>No buses available right now</Text>
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
  busInfo: {
    flex: 1,
  },
  routeName: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
    fontSize: 18,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  timeText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginLeft: 6,
    fontWeight: "600",
  },
  seatInfo: {
    marginTop: 4,
  },
  seatsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: "700",
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    ...SHADOWS.soft,
  },
  bookBtnText: {
    color: COLORS.white,
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
  closedContainer: {
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    maxWidth: 150,
  },
  closedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: "right",
    fontWeight: "600",
  },
  scheduleToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border + "50",
  },
  scheduleToggleText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "700",
  },
  scheduleDetails: {
    marginTop: 8,
    paddingLeft: 12,
  },
  scheduleRow: {
    flexDirection: "row",
    minHeight: 40,
  },
  scheduleTimeline: {
    width: 20,
    alignItems: "center",
  },
  scheduleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  scheduleLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.primary + "30",
    marginVertical: 2,
  },
  scheduleInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 12,
    paddingBottom: 12,
  },
  scheduleStopName: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
  scheduleTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
});
