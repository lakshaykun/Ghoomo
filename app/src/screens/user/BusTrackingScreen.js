import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { fetchBusRoutes } from "../../store/slices/busRoutesSlice";
import { api } from "../../services/api";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from "../../constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function BusTrackingScreen() {
  const dispatch = useDispatch();
  const routes = useSelector((state) => state.busRoutes.routes || []);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const busPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    dispatch(fetchBusRoutes()).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (!selectedRouteId && routes.length > 0) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes, selectedRouteId]);

  useEffect(() => {
    if (!selectedRouteId) return undefined;
    let mounted = true;
    const run = async () => {
      try {
        const payload = await api.getBusTracking(selectedRouteId);
        if (!mounted) return;
        setTracking(payload);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Unable to load live bus tracking.");
      }
    };

    setLoading(true);
    run().finally(() => { if (mounted) setLoading(false); });
    const intervalId = setInterval(run, 5000);
    
    // Pulse animation for bus icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(busPulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(busPulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [selectedRouteId]);

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) || null,
    [routes, selectedRouteId]
  );

  const live = tracking?.liveLocation || null;
  const stops = tracking?.stops || selectedRoute?.stopsDetailed || [];
  const nextStop = tracking?.upcomingStops?.[0] || null;

  // Determine stop status
  const getStopStatus = (stop) => {
    if (!live) return "upcoming";
    if (!nextStop) return "passed"; // Trip likely ended
    if (stop.id === nextStop.id) return "approaching";
    if (stop.stopOrder < nextStop.stopOrder) return "passed";
    return "upcoming";
  };

  const renderStopItem = (stop, index) => {
    const status = getStopStatus(stop);
    const isFirst = index === 0;
    const isLast = index === stops.length - 1;
    const isApproaching = status === "approaching";
    const isPassed = status === "passed";

    return (
      <View key={stop.id || index} style={styles.stopItem}>
        {/* Timeline Line & Dot */}
        <View style={styles.timelineContainer}>
          <View 
            style={[
              styles.timelineLine, 
              isFirst && styles.timelineLineFirst, 
              isLast && styles.timelineLineLast,
              isPassed && styles.timelineLinePassed
            ]} 
          />
          <View 
            style={[
              styles.timelineDot, 
              isApproaching && styles.timelineDotActive,
              isPassed && styles.timelineDotPassed
            ]} 
          />
          {isApproaching && (
            <Animated.View style={[styles.busIconContainer, { transform: [{ scale: busPulseAnim }] }]}>
              <FontAwesome5 name="bus" size={14} color={COLORS.white} />
            </Animated.View>
          )}
        </View>

        {/* Stop Content */}
        <View style={[styles.stopContent, isPassed && styles.stopContentPassed]}>
          <View style={styles.stopHeader}>
            <Text style={[styles.stopName, isApproaching && styles.stopNameActive]}>{stop.name}</Text>
            {isApproaching && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>NEXT STOP</Text>
              </View>
            )}
          </View>
          
          <View style={styles.stopMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={isPassed ? COLORS.gray : COLORS.grayDark} />
              <Text style={styles.metaText}>{stop.arrivalTime || "Scheduled"}</Text>
            </View>
            {stop.etaMinutes != null && !isPassed && (
              <Text style={[styles.etaText, isApproaching && styles.etaTextActive]}>
                {stop.etaMinutes === 0 ? "Arriving" : `ETA: ${stop.etaMinutes} min`}
              </Text>
            )}
            {isPassed && <Text style={styles.passedText}>Departed</Text>}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Bus Tracking</Text>
              <Text style={styles.headerSubtitle}>Real-time movement & ETAs</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => setSelectedRouteId(selectedRouteId)}>
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="refresh" size={22} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.routesScroll}
          >
            {routes.map((route) => (
              <TouchableOpacity
                key={route.id}
                style={[styles.routeChip, selectedRouteId === route.id && styles.routeChipActive]}
                onPress={() => setSelectedRouteId(route.id)}
              >
                <Text style={[styles.routeChipText, selectedRouteId === route.id && styles.routeChipTextActive]}>
                  {route.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Status Card */}
        {live ? (
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: live.status === "delayed" ? COLORS.error : COLORS.success }]} />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>
                  Bus is {live.status === "delayed" ? `delayed by ${live.delayMinutes}m` : "on time"}
                </Text>
                <Text style={styles.lastUpdate}>
                  Last updated {new Date(live.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.speedInfo}>
                <Text style={styles.speedValue}>{live.speedKmph || 0}</Text>
                <Text style={styles.speedUnit}>km/h</Text>
              </View>
            </View>
          </View>
        ) : (
          !loading && (
            <View style={styles.offlineCard}>
              <Ionicons name="cloud-offline-outline" size={24} color={COLORS.grayDark} />
              <Text style={styles.offlineText}>Bus is currently offline</Text>
            </View>
          )
        )}

        {/* Timeline Section */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Route Timeline</Text>
          <View style={styles.timelineList}>
            {stops.length > 0 ? (
              stops.map(renderStopItem)
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No stops defined for this route.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      {error && (
        <BlurView intensity={80} style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  routesScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 10,
  },
  routeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  routeChipActive: {
    backgroundColor: COLORS.white,
  },
  routeChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  routeChipTextActive: {
    color: COLORS.primary,
  },
  content: { flex: 1 },
  contentInner: { padding: SPACING.lg, paddingBottom: 100 },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusIndicator: { width: 4, height: 40, borderRadius: 2, marginRight: SPACING.md },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  lastUpdate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  speedInfo: { alignItems: "center", paddingLeft: SPACING.md, borderLeftWidth: 1, borderLeftColor: COLORS.border },
  speedValue: { fontSize: 20, fontWeight: "800", color: COLORS.primary },
  speedUnit: { fontSize: 10, fontWeight: "600", color: COLORS.grayDark },
  offlineCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: SPACING.xl,
    backgroundColor: COLORS.grayLight,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  offlineText: { fontSize: 15, fontWeight: "600", color: COLORS.grayDark },
  timelineSection: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.lg },
  timelineList: { paddingLeft: 8 },
  stopItem: { flexDirection: "row", minHeight: 80 },
  timelineContainer: { alignItems: "center", width: 40, marginRight: SPACING.sm },
  timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.borderStrong },
  timelineLineFirst: { marginTop: 20 },
  timelineLineLast: { height: 20, flex: 0 },
  timelineLinePassed: { backgroundColor: COLORS.primary },
  timelineDot: { 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: COLORS.white, 
    borderWidth: 3, 
    borderColor: COLORS.borderStrong,
    position: "absolute",
    top: 20,
    zIndex: 2,
  },
  timelineDotActive: { borderColor: COLORS.primary, backgroundColor: COLORS.white, width: 18, height: 18, borderRadius: 9 },
  timelineDotPassed: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  busIconContainer: {
    position: "absolute",
    top: 15,
    zIndex: 10,
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: RADIUS.pill,
    ...SHADOWS.soft,
  },
  stopContent: { flex: 1, paddingBottom: SPACING.xl, paddingTop: 16 },
  stopContentPassed: { opacity: 0.6 },
  stopHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  stopName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  stopNameActive: { color: COLORS.primary, fontSize: 18 },
  liveBadge: { 
    backgroundColor: COLORS.primaryLight, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 4 
  },
  liveBadgeText: { fontSize: 10, fontWeight: "800", color: COLORS.primary },
  stopMeta: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  etaText: { fontSize: 13, fontWeight: "700", color: COLORS.info },
  etaTextActive: { color: COLORS.primary },
  passedText: { fontSize: 12, fontWeight: "600", color: COLORS.grayDark },
  emptyState: { padding: SPACING.xl, alignItems: "center" },
  emptyText: { color: COLORS.textSecondary },
  errorBanner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: "rgba(220, 38, 38, 0.9)",
  },
  errorText: { color: COLORS.white, textAlign: "center", fontWeight: "600" },
});

