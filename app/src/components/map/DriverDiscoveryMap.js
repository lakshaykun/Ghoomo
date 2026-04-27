import React, { useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import MapView, { Marker, UrlTile, AnimatedRegion } from "react-native-maps";
import { COLORS } from "../../constants";
import { getMapRegion } from "../../utils/map";

function AnimatedDriverMarker({ driver }) {
  const coordinate = useRef(new AnimatedRegion({
    latitude: driver.latitude,
    longitude: driver.longitude,
    latitudeDelta: 0,
    longitudeDelta: 0,
  })).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      coordinate.timing({
        latitude: driver.latitude,
        longitude: driver.longitude,
        duration: 1300,
        useNativeDriver: false,
      }).start();
    }
  }, [driver.latitude, driver.longitude]);

  return (
    <Marker.Animated coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }}>
      <View style={[styles.driverDot, { backgroundColor: COLORS.accentOrange }]} />
    </Marker.Animated>
  );
}

export default function DriverDiscoveryMap({
  pickup,
  drivers = [],
  refreshedAt,
  autoRefreshSeconds = 6,
  loading = false,
  style,
  onRegionChangeComplete
}) {
  const isWeb = Platform.OS === 'web';
  
  const normPickup = useMemo(() => {
    if (!pickup) return null;
    if (Array.isArray(pickup) && pickup.length >= 2) return { latitude: Number(pickup[1]), longitude: Number(pickup[0]) };
    if (pickup.lat !== undefined && pickup.lng !== undefined) return { latitude: Number(pickup.lat), longitude: Number(pickup.lng) };
    if (pickup.latitude !== undefined && pickup.longitude !== undefined) return { latitude: Number(pickup.latitude), longitude: Number(pickup.longitude) };
    return null;
  }, [pickup]);

  // Limit driver markers for performance and clarity
  const MAX_DRIVERS = 15;
  const filteredDrivers = useMemo(() => {
    return drivers
      .filter((d) => Number.isFinite(Number(d.latitude)) && Number.isFinite(Number(d.longitude)))
      .slice(0, MAX_DRIVERS);
  }, [drivers]);

  const allPoints = useMemo(() => [normPickup, ...filteredDrivers].filter(Boolean), [normPickup, filteredDrivers]);
  const autoRegion = useMemo(() => getMapRegion(allPoints), [allPoints]);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && allPoints.length > 0) {
      mapRef.current.animateToRegion({
        latitude: autoRegion.latitude,
        longitude: autoRegion.longitude,
        latitudeDelta: Math.max(0.01, 180 / Math.pow(2, autoRegion.zoom)),
        longitudeDelta: Math.max(0.01, 360 / Math.pow(2, autoRegion.zoom)),
      }, 1000);
    }
  }, [normPickup]);

  if (isWeb) {
    return (
      <View style={[styles.wrapper, style]}>
        <Text>Map not supported on web currently.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: autoRegion.latitude,
          longitude: autoRegion.longitude,
          latitudeDelta: Math.max(0.01, 180 / Math.pow(2, autoRegion.zoom)),
          longitudeDelta: Math.max(0.01, 360 / Math.pow(2, autoRegion.zoom)),
        }}
        mapType="none"
        showsUserLocation={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        showsMyLocationButton={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        <UrlTile
          urlTemplate="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        
        {normPickup && (
          <Marker coordinate={normPickup} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.pickupDot, { backgroundColor: COLORS.success }]} />
          </Marker>
        )}
        
        {filteredDrivers.map(driver => (
          <AnimatedDriverMarker key={driver.id} driver={driver} />
        ))}
      </MapView>

      <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>Live Driver Discovery</Text>
        <Text style={styles.headerSub}>
          {loading
            ? "Refreshing nearby drivers..."
            : `${filteredDrivers.length} online drivers • auto-refresh ${autoRefreshSeconds}s`}
        </Text>
        {refreshedAt ? (
          <Text style={styles.headerTime}>
            Updated {new Date(refreshedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
          </Text>
        ) : null}
      </View>

      <View style={styles.attribution}>
        <Text style={styles.attributionText}>© OpenStreetMap, © CARTO</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 240,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#E5E3DF",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  pickupDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  driverDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  headerOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(15,23,42,0.72)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.white,
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.88)",
    marginTop: 2,
  },
  headerTime: {
    fontSize: 10,
    color: "rgba(255,255,255,0.74)",
    marginTop: 3,
  },
  attribution: {
    position: "absolute",
    right: 10,
    bottom: 8,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  attributionText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
