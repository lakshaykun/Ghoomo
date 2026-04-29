import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from "../../constants";
import { api } from "../../services/api";

export default function BusLiveTrackingScreen({ route, navigation }) {
  const { route: busRoute } = route.params;
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval;
    const fetchTracking = async () => {
      try {
        const data = await api.getBusTracking(busRoute.id);
        setTracking(data);
        setLoading(false);
      } catch (error) {
        console.error("Tracking fetch error:", error);
      }
    };

    fetchTracking();
    interval = setInterval(fetchTracking, 5000);

    return () => clearInterval(interval);
  }, [busRoute.id]);

  const stops = useMemo(() => tracking?.stops || [], [tracking]);
  const liveLocation = useMemo(() => tracking?.liveLocation, [tracking]);
  const nextStop = useMemo(() => tracking?.upcomingStops?.[0] || null, [tracking]);

  const renderTimeline = () => {
    if (!stops.length) return null;

    return (
      <ScrollView 
        contentContainerStyle={styles.timelineScroll} 
        showsVerticalScrollIndicator={false}
      >
        {stops.map((stop, index) => {
          const isPassed = !stop.isUpcoming;
          const isNext = nextStop && nextStop.id === stop.id;
          const isLast = index === stops.length - 1;
          const isFirst = index === 0;

          // Find if bus is currently between this stop and the next one
          const isBusAfterThis = !stop.isUpcoming && (stops[index + 1]?.isUpcoming);

          return (
            <View key={stop.id || index} style={styles.stopRow}>
              {/* Left Side: Time */}
              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, isPassed && styles.textDimmed]}>
                  {stop.arrivalTime || "--:--"}
                </Text>
                {isNext && (
                  <Text style={styles.etaText}>{stop.etaMinutes}m</Text>
                )}
              </View>

              {/* Middle: Line and Dot */}
              <View style={styles.indicatorContainer}>
                <View style={[
                  styles.line, 
                  isFirst && styles.lineFirst,
                  isLast && styles.lineLast,
                  isPassed && styles.linePassed
                ]} />
                
                <View style={[
                  styles.dot,
                  isPassed ? styles.dotPassed : styles.dotUpcoming,
                  isNext && styles.dotNext
                ]}>
                  {isNext && <View style={styles.dotPulse} />}
                </View>

                {/* Bus Icon between stops */}
                {isBusAfterThis && (
                  <View style={styles.busIndicator}>
                    <View style={styles.busIconCircle}>
                      <MaterialCommunityIcons name="bus" size={18} color={COLORS.white} />
                    </View>
                    <View style={styles.busPointer} />
                  </View>
                )}
              </View>

              {/* Right Side: Stop Name */}
              <View style={styles.nameContainer}>
                <Text style={[
                  styles.stopName, 
                  isPassed && styles.textDimmed,
                  isNext && styles.stopNameNext
                ]}>
                  {stop.name}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{busRoute.name}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: liveLocation ? COLORS.success : COLORS.error }]} />
            <Text style={styles.statusText}>{liveLocation ? "Live Tracking" : "Location Unavailable"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching live position...</Text>
          </View>
        ) : (
          renderTimeline()
        )}
      </View>

      {/* Bottom Floating Card for Speed & Next Stop */}
      {!loading && (
        <View style={styles.floatingCard}>
          <View style={styles.floatingRow}>
            <View style={styles.floatingBlock}>
              <Text style={styles.floatingLabel}>NEXT STOP</Text>
              <Text style={styles.floatingValue} numberOfLines={1}>
                {nextStop?.name || "Terminus"}
              </Text>
            </View>
            <View style={styles.floatingDivider} />
            <View style={styles.floatingBlock}>
              <Text style={styles.floatingLabel}>SPEED</Text>
              <Text style={styles.floatingValue}>{liveLocation?.speedKmph || 0} km/h</Text>
            </View>
            <View style={styles.floatingDivider} />
            <View style={styles.floatingBlock}>
              <Text style={styles.floatingLabel}>ETA</Text>
              <Text style={[styles.floatingValue, { color: COLORS.primary }]}>
                {nextStop ? `${nextStop.etaMinutes}m` : "--"}
              </Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  headerInfo: { flex: 1 },
  headerTitle: { ...TYPOGRAPHY.subtitle, color: COLORS.text },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },

  content: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginTop: 12 },

  timelineScroll: { paddingHorizontal: SPACING.xl, paddingTop: 40, paddingBottom: 120 },
  stopRow: { flexDirection: "row", minHeight: 80 },
  
  timeContainer: { width: 60, alignItems: "flex-end", paddingTop: 4 },
  timeText: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  etaText: { fontSize: 11, fontWeight: "800", color: COLORS.primary, marginTop: 4 },
  
  indicatorContainer: { width: 40, alignItems: "center" },
  line: { width: 4, flex: 1, backgroundColor: COLORS.border, marginVertical: -10 },
  linePassed: { backgroundColor: COLORS.primary },
  lineFirst: { marginTop: 10 },
  lineLast: { marginBottom: 10, flex: 0, height: 10 },
  
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.white, borderWidth: 3, zIndex: 2, marginTop: 6 },
  dotPassed: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  dotUpcoming: { borderColor: COLORS.borderStrong },
  dotNext: { borderColor: COLORS.primary, transform: [{ scale: 1.2 }] },
  dotPulse: { ...StyleSheet.absoluteFillObject, borderRadius: 7, backgroundColor: COLORS.primary, opacity: 0.3 },

  busIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -15,
    marginTop: -15,
    alignItems: "center",
    zIndex: 5,
  },
  busIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.card,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  busPointer: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: COLORS.primary,
    transform: [{ rotate: "180deg" }],
    marginTop: -2,
  },

  nameContainer: { flex: 1, paddingLeft: 16, paddingTop: 2 },
  stopName: { ...TYPOGRAPHY.body, fontWeight: "600", color: COLORS.text },
  stopNameNext: { color: COLORS.primary, fontWeight: "800" },
  textDimmed: { color: COLORS.textSecondary, opacity: 0.6 },

  floatingCard: {
    position: "absolute",
    bottom: SPACING.xl,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  floatingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  floatingBlock: { flex: 1, alignItems: "center" },
  floatingLabel: { fontSize: 9, fontWeight: "800", color: COLORS.gray, marginBottom: 4 },
  floatingValue: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  floatingDivider: { width: 1, height: 24, backgroundColor: COLORS.border },
});
