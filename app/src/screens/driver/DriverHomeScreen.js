import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { logoutUser } from "../../store/slices/authSlice";
import {
  driverUpdateRideStatus,
  fetchDriverDashboard,
  toggleDriverOnline,
  updateDriverLocation,
} from "../../store/slices/driverSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import OsmRouteMap from "../../components/map/OsmRouteMap";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, BOOKING_STATUS } from "../../constants";
import { ensureDriverBackgroundLocation, stopDriverBackgroundLocation } from "../../services/backgroundLocation";
import { api } from "../../services/api";
import { subscribeGlobalRealtime } from "../../services/realtime";
import { fetchOSRMRoute } from "../../utils/map";

const EMPTY_ROUTE_POINTS = [];

export default function DriverHomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { dashboard, loading, error } = useSelector((state) => state.driver);
  const watchSubscriptionRef = useRef(null);
  const webWatchIdRef = useRef(null);
  const wsUnsubRef = useRef(null);
  const [sharedRequest, setSharedRequest] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [routeData, setRouteData] = useState(null);

  const authToken = useSelector((state) => state.auth.token || state.auth.accessToken || null);
  const isOnline = Boolean(dashboard?.online ?? user?.online);
  const driverUserId = user?.id || dashboard?.driver?.userId || null;

  useEffect(() => {
    if (!driverUserId) return undefined;

    dispatch(fetchDriverDashboard(driverUserId)).catch(() => { });
    const intervalId = setInterval(() => {
      dispatch(fetchDriverDashboard(driverUserId)).catch(() => { });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [dispatch, driverUserId]);

  useEffect(() => {
    let mounted = true;

    const startTracking = async () => {
      if (!dashboard?.online || !driverUserId) return;
      try {
        if (Platform.OS !== "web") await ensureDriverBackgroundLocation();
      } catch (permissionError) {
        // We only alert if it's a critical foreground error.
        // ensureDriverBackgroundLocation now handles background denial silently.
        if (mounted && permissionError.message.includes("Foreground")) {
          Alert.alert("Location Permission Required", permissionError.message);
        }
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || !mounted) return;

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (mounted) {
        dispatch(
          updateDriverLocation(driverUserId, {
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          })
        ).catch(() => { });
      }

      if (Platform.OS === "web" && globalThis.navigator?.geolocation?.watchPosition) {
        const watchId = globalThis.navigator.geolocation.watchPosition(
          (position) => {
            dispatch(
              updateDriverLocation(driverUserId, {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              })
            ).catch(() => { });
          },
          () => { },
          { enableHighAccuracy: false, maximumAge: 5000, timeout: 10000 }
        );

        if (mounted) webWatchIdRef.current = watchId;
        else globalThis.navigator.geolocation.clearWatch(watchId);
        return;
      }

      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 20, timeInterval: 7000 },
        (position) => {
          dispatch(
            updateDriverLocation(driverUserId, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          ).catch(() => { });
        }
      );

      if (mounted) watchSubscriptionRef.current = subscription;
      else {
        try { subscription.remove?.(); } catch (_error) { }
      }
    };

    startTracking();

    return () => {
      mounted = false;
      if (webWatchIdRef.current !== null && globalThis.navigator?.geolocation?.clearWatch) {
        globalThis.navigator.geolocation.clearWatch(webWatchIdRef.current);
        webWatchIdRef.current = null;
      }
      if (watchSubscriptionRef.current) {
        try { watchSubscriptionRef.current.remove?.(); } catch (_error) { }
        watchSubscriptionRef.current = null;
      }
    };
  }, [dashboard?.online, dispatch, driverUserId]);

  const handleToggleOnline = (nextValue) => {
    if (!nextValue) stopDriverBackgroundLocation().catch(() => { });
    dispatch(toggleDriverOnline(driverUserId, nextValue)).catch((toggleError) =>
      Alert.alert("Update Failed", toggleError.message)
    );
  };

  // Subscribe to real-time ride requests via WebSocket when online
  useEffect(() => {
    if (!isOnline || !authToken) {
      wsUnsubRef.current?.();
      return undefined;
    }
    const unsubscribe = subscribeGlobalRealtime(authToken, {
      onEvent: (event, data) => {
        console.log(`[DriverWS] Event: ${event}`, data);
        if (event === "new_ride_request" && data?.request) {
          setIncomingRequests((prev) => {
            const exists = prev.some((r) => r.id === data.request.id);
            return exists ? prev : [data.request, ...prev].slice(0, 10);
          });
          // Also refresh the dashboard
          dispatch(fetchDriverDashboard(driverUserId)).catch(() => { });
        }
      },
    });
    wsUnsubRef.current = unsubscribe;
    return () => unsubscribe();
  }, [isOnline, authToken, dispatch, driverUserId]);

  const handleRideAction = (rideId, status, extra = {}) => {
    dispatch(driverUpdateRideStatus(driverUserId, rideId, status, extra))
      .then(() => {
        if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED].includes(status)) {
          dispatch(fetchDriverDashboard(driverUserId)).catch(() => { });
        }
      })
      .catch((rideError) =>
        Alert.alert("Ride Update Failed", rideError.message)
      );
  };

  const handleAcceptRide = (ride) => {
    if (ride?.sourceType !== "ride_request_candidate") {
      Alert.alert("Action Not Allowed", "Only pending ride requests can be accepted.");
      return;
    }
    handleRideAction(ride.id, BOOKING_STATUS.ACCEPTED, {
      actor: "driver",
      sourceType: ride.sourceType,
      driverId: driverUserId,
    });
  };

  const handleAcceptIncomingRequest = (requestId, request) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    api.assignDriver(requestId, {
      driverId: driverUserId,
      fare: request.fare,
      distance: request.distance,
    })
      .then(() => {
        dispatch(fetchDriverDashboard(driverUserId)).catch(() => { });
      })
      .catch((err) => {
        Alert.alert("Assignment Failed", err.message || "Someone else might have accepted this ride.");
      });
  };

  const assignedRides = dashboard?.assignedRides || [];
  const activeRide =
    dashboard?.activeRide ||
    assignedRides.find((ride) => ride.sourceType === "ride" && ride.status === BOOKING_STATUS.IN_PROGRESS) ||
    assignedRides.find((ride) => ride.sourceType === "ride" && ride.status === BOOKING_STATUS.ARRIVED) ||
    assignedRides.find((ride) => ride.sourceType === "ride" && ride.status === BOOKING_STATUS.ACCEPTED) ||
    null;
  const completedRides = dashboard?.completedRides || [];
  const driverProfile = dashboard?.driver || user || {};
  const stats = dashboard?.stats || { todayEarnings: 0, ridesToday: 0, rating: user?.rating || 0 };

  useEffect(() => {
    console.log("[DriverHome] State check:", {
      isOnline,
      dashboardOnline: dashboard?.online,
      userOnline: user?.online,
      userId: user?.id,
      hasDashboard: !!dashboard
    });
  }, [isOnline, dashboard?.online, user?.online]);

  useEffect(() => {
    if (activeRide?.status && [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.ARRIVED, BOOKING_STATUS.OTP_VERIFIED, BOOKING_STATUS.IN_PROGRESS].includes(activeRide.status)) {
      const isHeadingToPickup = [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.ARRIVED].includes(activeRide.status);
      const source = dashboard?.location || activeRide.driver || activeRide.pickup;
      const destination = isHeadingToPickup ? activeRide.pickup : activeRide.drop;

      if (source?.latitude && source?.longitude && destination?.latitude && destination?.longitude) {
        // Only fetch if they are different enough to matter (approx > 15m)
        const dLat = Math.abs(source.latitude - destination.latitude);
        const dLon = Math.abs(source.longitude - destination.longitude);
        if (dLat < 0.00015 && dLon < 0.00015) {
           setRouteData({ points: [source, destination], distance: 0, duration: 0 });
           return;
        }

        fetchOSRMRoute(source, destination, true).then((res) => {
          if (res && res.points && res.points.length > 0) {
            setRouteData(res);
          }
        }).catch(() => {});
      }
    }
  }, [activeRide?.driver?.latitude, activeRide?.driver?.longitude, activeRide?.pickup, activeRide?.drop, activeRide?.status, dashboard?.location]);

  useEffect(() => {
    if (!activeRide?.id || !activeRide?.isShare) {
      setSharedRequest(null);
      return undefined;
    }

    api.getSharedRideByRide(activeRide.id)
      .then(({ request }) => setSharedRequest(request))
      .catch(() => setSharedRequest(null));

    const intervalId = setInterval(() => {
      api.getSharedRideByRide(activeRide.id)
        .then(({ request }) => setSharedRequest(request))
        .catch(() => setSharedRequest(null));
    }, 7000);

    return () => clearInterval(intervalId);
  }, [activeRide?.id, activeRide?.isShare]);

  const handleRejectRide = (ride) => {
    if (!ride?.id) {
      Alert.alert("Action Not Allowed", "Ride details are missing. Please refresh and try again.");
      return;
    }
    Alert.alert("Reject Ride", "This ride will be reassigned to the next nearest driver if available.", [
      { text: "Keep Ride", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () =>
          handleRideAction(ride.id, BOOKING_STATUS.CANCELLED, {
            actor: "driver",
            driverId: user?.id,
            reason: "Driver rejected ride before pickup",
            sourceType: ride.sourceType,
          }),
      },
    ]);
  };

  const handleMarkArrived = async (ride) => {
    if (ride?.sourceType !== "ride") {
      Alert.alert("Assignment Syncing", "This request is still syncing to an assigned ride. Pull to refresh and try again.");
      return;
    }
    try {
      await dispatch(
        driverUpdateRideStatus(user.id, ride.id, BOOKING_STATUS.ARRIVED, {
          actor: "driver",
          sourceType: ride.sourceType,
        })
      );
      navigation.getParent()?.navigate("DriverOtp", { rideId: ride.id });
    } catch (rideError) {
      Alert.alert("Ride Update Failed", rideError.message);
    }
  };
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <View style={[styles.header, { backgroundColor: isOnline ? COLORS.success : COLORS.surfaceDark }]}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.driverName}>{user?.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={COLORS.warning} />
                  <Text style={styles.rating}>{stats.rating || driverProfile?.rating || user?.rating || 0} • {driverProfile?.vehicleType || user?.vehicleType || "driver"}</Text>
                </View>
                {dashboard?.location ? (
                  <Text style={styles.locationText}>
                    {dashboard.location.latitude.toFixed(5)}, {dashboard.location.longitude.toFixed(5)}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => dispatch(logoutUser())} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={24} color={COLORS.surface} />
              </TouchableOpacity>
            </View>

            <View style={styles.onlineCard}>
              <View style={styles.onlineTextWrap}>
                <Text style={styles.onlineTitle}>{isOnline ? "You are Online" : "You are Offline"}</Text>
                <Text style={styles.onlineSub}>
                  {isOnline ? "Receiving trip requests" : "Go online to start earning"}
                </Text>
              </View>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                trackColor={{ false: COLORS.borderStrong, true: COLORS.surface }}
                thumbColor={isOnline ? COLORS.success : COLORS.surface}
              />
            </View>
            {error ? <Text style={styles.headerError}>{error}</Text> : null}
          </View>

          <View style={styles.section}>
            <View style={styles.statsRow}>
              <Card elevated style={styles.statCard}>
                <Ionicons name="cash" size={24} color={COLORS.success} />
                <Text style={styles.statVal}>₹{stats.todayEarnings}</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </Card>
              <Card elevated style={styles.statCard}>
                <Ionicons name="car" size={24} color={COLORS.primary} />
                <Text style={styles.statVal}>{stats.ridesToday}</Text>
                <Text style={styles.statLabel}>Trips</Text>
              </Card>
              <Card elevated style={styles.statCard}>
                <Ionicons name="navigate" size={24} color={COLORS.info} />
                <Text style={styles.statVal}>{assignedRides.length}</Text>
                <Text style={styles.statLabel}>Assigned</Text>
              </Card>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Assignment</Text>
            {loading && !dashboard ? (
              <Card style={styles.loadingCard}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading driver dashboard...</Text>
              </Card>
            ) : activeRide ? (
              <>
                <View style={styles.mapCard}>
                  <OsmRouteMap
                    pickup={activeRide.pickup}
                    drop={activeRide.drop}
                    driver={activeRide.driver}
                    routePoints={routeData?.points || activeRide.route?.geometry || []}
                  />
                </View>
                <Card elevated style={styles.assignmentCard}>
                  <View style={styles.assignmentHeader}>
                    <View style={{ flex: 1, marginRight: SPACING.md }}>
                      <Text style={styles.assignmentTitle} numberOfLines={1}>{activeRide.pickup?.name}</Text>
                      <Text style={styles.assignmentSubtitle} numberOfLines={1}>To: {activeRide.drop?.name}</Text>
                    </View>
                    <Badge status={activeRide.status} />
                  </View>
                  <View style={styles.assignmentMetaRow}>
                    <Text style={styles.assignmentMeta}>Fare: ₹{activeRide.fare}</Text>
                    {routeData && routeData.duration !== undefined ? (
                      <>
                        <Text style={styles.assignmentMeta}>{Number(routeData.distance / 1000 || 0).toFixed(1)} km</Text>
                        <Text style={styles.assignmentMeta}>{Math.round(routeData.duration / 60)} min</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.assignmentMeta}>{activeRide.distance} km</Text>
                        <Text style={styles.assignmentMeta}>{activeRide.durationMinutes} min</Text>
                      </>
                    )}
                  </View>
                  {activeRide.isShare && sharedRequest ? (
                    <View style={styles.sharedPassengersWrap}>
                      <Text style={styles.sharedPassengersTitle}>Shared Ride Participants</Text>
                      <View style={styles.sharedPassengersRow}>
                        <View style={[styles.sharedPassengerChip, styles.sharedPassengerOwner]}>
                          <Text style={styles.sharedPassengerOwnerText}>Owner</Text>
                        </View>
                        {sharedRequest.acceptedUsers.map((participant) => (
                          <View key={participant.userId} style={styles.sharedPassengerChip}>
                            <Text style={styles.sharedPassengerText}>{participant.name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                  <View style={styles.actionRow}>
                    {activeRide.status === BOOKING_STATUS.ACCEPTED ? (
                      <View style={styles.otpStartWrap}>
                        <Button title="Arrived at Pickup" onPress={() => handleMarkArrived(activeRide)} variant="primary" size="lg" style={{ flex: 1 }} />
                        <Button title="Reject" onPress={() => handleRejectRide(activeRide)} variant="danger" variant2="outline" style={{ marginTop: SPACING.sm }} />
                      </View>
                    ) : null}
                    {activeRide.status === BOOKING_STATUS.ARRIVED ? (
                      <Button title="Enter OTP to Start" onPress={() => navigation.getParent()?.navigate("DriverOtp", { rideId: activeRide.id })} variant="primary" size="lg" style={{ flex: 1 }} />
                    ) : null}
                    {activeRide.status === BOOKING_STATUS.IN_PROGRESS ? (
                      <Button title="End Trip" onPress={() => handleRideAction(activeRide.id, BOOKING_STATUS.COMPLETED, { actor: "driver", sourceType: activeRide.sourceType })} variant="success" size="lg" style={{ flex: 1 }} />
                    ) : null}
                  </View>
                </Card>
              </>
            ) : (
              <Card style={styles.noRequests}>
                <Ionicons name="search" size={32} color={COLORS.borderStrong} />
                <Text style={styles.noRequestsText}>
                  {dashboard?.online ? "Listening for nearby trip requests..." : "Go online to start receiving trips."}
                </Text>
              </Card>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Requests ({incomingRequests.length})</Text>
            {incomingRequests.length === 0 ? (
              <Card style={styles.noRequests}>
                <Ionicons name="notifications-outline" size={32} color={COLORS.border} />
                <Text style={styles.noRequestsText}>No new requests nearby.</Text>
              </Card>
            ) : (
              incomingRequests.map((request) => (
                <Card key={request.id} elevated style={[styles.rideCard, { borderColor: COLORS.success + "40", borderLeftWidth: 4 }]}>
                  <View style={styles.requestHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.passengerName} numberOfLines={1}>{request.pickup_location}</Text>
                      <Text style={styles.routeText} numberOfLines={1}>To: {request.drop_location}</Text>
                    </View>
                    <View style={styles.fareWrap}>
                      <Text style={[styles.reqFare, { color: COLORS.success }]}>{request.vehicle_type?.toUpperCase() || "AUTO"}</Text>
                      <Badge status="SEARCHING" />
                    </View>
                  </View>
                  <View style={styles.pendingActionRow}>
                    <Button
                      title="Accept Ride"
                      onPress={() => handleAcceptIncomingRequest(request.id, request)}
                      variant="success"
                      style={{ flex: 1 }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        api.rejectRideRequest(request.id).catch(() => { });
                        setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
                      }}
                      style={styles.ignoreBtn}
                    >
                      <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Rides</Text>
            {assignedRides.length === 0 ? (
              <Card style={styles.noRequests}>
                <Text style={styles.noRequestsText}>No assigned rides yet.</Text>
              </Card>
            ) : (
              assignedRides.map((ride) => (
                <Card key={ride.id} elevated style={styles.rideCard}>
                  <View style={styles.requestHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.passengerName} numberOfLines={1}>{ride.pickup?.name}</Text>
                      <Text style={styles.routeText} numberOfLines={1}>{ride.drop?.name}</Text>
                    </View>
                    <View style={styles.fareWrap}>
                      <Text style={styles.reqFare}>₹{ride.fare}</Text>
                      <Badge status={ride.status} />
                    </View>
                  </View>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeSubText}>Type: {ride.rideType}{ride.isShare ? " (Shared)" : ""}</Text>
                  </View>
                  {ride.status === BOOKING_STATUS.PENDING && ride.sourceType === "ride_request_candidate" ? (
                    <View style={styles.pendingActionRow}>
                      <Button title="Accept Request" onPress={() => handleAcceptRide(ride)} variant="success" style={{ flex: 1 }} />
                    </View>
                  ) : null}
                </Card>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Trip History</Text>
            </View>
            {completedRides.length === 0 ? (
              <Card style={styles.noRequests}>
                <Text style={styles.noRequestsText}>No completed trips yet.</Text>
              </Card>
            ) : (
              completedRides.map((ride) => (
                <Card key={ride.id} elevated style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <View style={{ flex: 1, paddingRight: SPACING.sm }}>
                      <Text style={styles.historyTitle} numberOfLines={1}>{ride.pickup?.name} → {ride.drop?.name}</Text>
                      <Text style={styles.historySub}>
                        {new Date(ride.updatedAt || ride.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {" • "}
                        {ride.distance} km • {ride.durationMinutes} min
                      </Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyFare}>₹{ride.fare}</Text>
                      <Badge status={ride.status} />
                    </View>
                  </View>
                </Card>
              ))
            )}
          </View>

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xl, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, ...SHADOWS.card },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SPACING.lg },
  driverName: { ...TYPOGRAPHY.title, color: COLORS.surface },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rating: { ...TYPOGRAPHY.label, color: COLORS.surface },
  locationText: { ...TYPOGRAPHY.caption, color: COLORS.surface, marginTop: 6, opacity: 0.8 },
  logoutBtn: { padding: SPACING.sm },
  onlineCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(0,0,0,0.15)", borderRadius: RADIUS.lg, padding: SPACING.lg },
  onlineTextWrap: { flex: 1, paddingRight: SPACING.md },
  onlineTitle: { ...TYPOGRAPHY.subtitle, color: COLORS.surface },
  onlineSub: { ...TYPOGRAPHY.label, color: COLORS.surface, marginTop: 2, opacity: 0.9 },
  headerError: { marginTop: SPACING.md, ...TYPOGRAPHY.label, color: COLORS.error, fontWeight: "700" },
  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
  sectionTitle: { ...TYPOGRAPHY.subtitle, marginBottom: SPACING.md },
  statsRow: { flexDirection: "row", gap: SPACING.md },
  statCard: { flex: 1, alignItems: "center", paddingVertical: SPACING.lg },
  statVal: { ...TYPOGRAPHY.title, marginTop: 8 },
  statLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },
  loadingCard: { alignItems: "center", paddingVertical: SPACING.xl, gap: 12 },
  loadingText: { ...TYPOGRAPHY.label, color: COLORS.textSecondary },
  mapCard: { height: 200, borderRadius: RADIUS.lg, overflow: "hidden", marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  assignmentCard: { marginBottom: SPACING.sm },
  assignmentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SPACING.sm },
  assignmentTitle: { ...TYPOGRAPHY.body, fontWeight: "700", color: COLORS.text },
  assignmentSubtitle: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginTop: 4 },
  assignmentMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.md, marginBottom: SPACING.sm },
  assignmentMeta: { ...TYPOGRAPHY.caption, fontWeight: "700", color: COLORS.textSecondary },
  sharedPassengersWrap: { marginBottom: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderColor: COLORS.border },
  sharedPassengersTitle: { ...TYPOGRAPHY.caption, fontWeight: "700", marginBottom: 8 },
  sharedPassengersRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sharedPassengerChip: { backgroundColor: COLORS.background, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  sharedPassengerText: { ...TYPOGRAPHY.caption, fontWeight: "600" },
  sharedPassengerOwner: { backgroundColor: COLORS.success + "15", borderColor: COLORS.success },
  sharedPassengerOwnerText: { ...TYPOGRAPHY.caption, fontWeight: "700", color: COLORS.success },
  actionRow: { marginTop: SPACING.md },
  otpStartWrap: { flex: 1 },
  noRequests: { alignItems: "center", paddingVertical: SPACING.xl, gap: 12 },
  noRequestsText: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, textAlign: "center" },
  rideCard: { marginBottom: SPACING.md },
  requestHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: SPACING.md },
  passengerName: { ...TYPOGRAPHY.body, fontWeight: "700", color: COLORS.text },
  routeText: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginTop: 4 },
  routeInfo: { marginTop: SPACING.sm },
  routeSubText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  pendingActionRow: { marginTop: SPACING.md },
  fareWrap: { alignItems: "flex-end", gap: 6 },
  reqFare: { ...TYPOGRAPHY.subtitle, color: COLORS.primary },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
  historyCard: { marginBottom: SPACING.sm },
  historyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: SPACING.md },
  historyTitle: { ...TYPOGRAPHY.label, fontWeight: "700" },
  historySub: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },
  historyRight: { alignItems: "flex-end", gap: 6 },
  historyFare: { ...TYPOGRAPHY.body, fontWeight: "800", color: COLORS.text },
  ignoreBtn: { padding: SPACING.sm, marginLeft: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
});
