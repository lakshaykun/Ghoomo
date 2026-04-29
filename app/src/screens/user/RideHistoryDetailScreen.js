import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/common/Header";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import OsmRouteMap from "../../components/map/OsmRouteMap";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from "../../constants";

export default function RideHistoryDetailScreen({ navigation, route }) {
  const { ride } = route.params;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Ride Details" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.mapContainer}>
          <OsmRouteMap 
            pickup={ride.pickup} 
            drop={ride.drop} 
            routePoints={ride.route?.geometry || []} 
          />
        </View>

        <View style={styles.content}>
          <Card elevated style={styles.card}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.date}>
                  {new Date(ride.createdAt).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                </Text>
                <Text style={styles.rideType}>
                  {ride.rideType?.toUpperCase()} • {ride.isShare ? "SHARED" : "SOLO"}
                </Text>
              </View>
              <Badge status={ride.status} />
            </View>

            <View style={styles.divider} />

            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText}>{ride.pickup?.name || ride.pickupLocation}</Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Drop</Text>
                <Text style={styles.locationText}>{ride.drop?.name || ride.dropLocation}</Text>
              </View>
            </View>
          </Card>

          {ride.driver && (
            <Card elevated style={styles.card}>
              <Text style={styles.sectionTitle}>Driver Information</Text>
              <View style={styles.driverRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(ride.driver_name || "D")[0]}</Text>
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{ride.driver_name || "Driver"}</Text>
                  <Text style={styles.vehicleInfo}>
                    {ride.driver_vehicle_type} • {ride.driver_vehicle_number}
                  </Text>
                </View>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color={COLORS.warning} />
                  <Text style={styles.ratingText}>{ride.driver_rating || "5.0"}</Text>
                </View>
              </View>
            </Card>
          )}

          <Card elevated style={styles.card}>
            <Text style={styles.sectionTitle}>Fare Summary</Text>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Total Fare</Text>
              <Text style={styles.fareValue}>₹{Number(ride.fare).toFixed(2)}</Text>
            </View>
            {ride.isShare && ride.total_passengers > 0 && (
              <>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Total Passengers</Text>
                  <Text style={styles.fareValue}>{ride.total_passengers}</Text>
                </View>
                <View style={[styles.fareRow, styles.finalFareRow]}>
                  <Text style={styles.finalFareLabel}>Your Split</Text>
                  <Text style={styles.finalFareValue}>₹{Number(ride.final_fare_per_person || ride.fare).toFixed(2)}</Text>
                </View>
              </>
            )}
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Distance</Text>
              <Text style={styles.fareValue}>{ride.distance} km</Text>
            </View>
          </Card>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  mapContainer: { height: 200, width: '100%' },
  content: { padding: SPACING.md },
  card: { marginBottom: SPACING.md, padding: SPACING.md },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  date: { ...TYPOGRAPHY.label, color: COLORS.textSecondary },
  rideType: { ...TYPOGRAPHY.body, fontWeight: "800", color: COLORS.text, marginTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  locationRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: SPACING.md },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6, marginRight: 12 },
  locationInfo: { flex: 1 },
  locationLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  locationText: { ...TYPOGRAPHY.body, fontWeight: "600", color: COLORS.text },
  sectionTitle: { ...TYPOGRAPHY.subtitle, fontWeight: "800", marginBottom: SPACING.md },
  driverRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primaryLight + "30", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "800", color: COLORS.primary },
  driverInfo: { flex: 1, marginLeft: SPACING.md },
  driverName: { ...TYPOGRAPHY.body, fontWeight: "700" },
  vehicleInfo: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { ...TYPOGRAPHY.body, fontWeight: "700" },
  fareRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.sm },
  fareLabel: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  fareValue: { ...TYPOGRAPHY.body, fontWeight: "600" },
  finalFareRow: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  finalFareLabel: { ...TYPOGRAPHY.subtitle, fontWeight: "800", color: COLORS.primary },
  finalFareValue: { ...TYPOGRAPHY.title, color: COLORS.primary },
});
