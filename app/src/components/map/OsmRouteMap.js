import React, { useMemo, useRef, useEffect } from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import MapView, { Marker, Polyline, UrlTile } from "react-native-maps";
import { COLORS } from "../../constants";
import { getMapRegion } from "../../utils/map";

const MIN_ZOOM = 9;
const MAX_ZOOM = 18;

export default function OsmRouteMap({ pickup, drop, driver, routePoints = [], style, children, onRegionChangeComplete, mapRef }) {
  const normalizePoint = (p) => {
    if (!p) return null;
    if (Array.isArray(p) && p.length >= 2) return { latitude: Number(p[1]), longitude: Number(p[0]) };
    if (p.lat !== undefined && p.lng !== undefined) return { latitude: Number(p.lat), longitude: Number(p.lng) };
    if (p.latitude !== undefined && p.longitude !== undefined) return { latitude: Number(p.latitude), longitude: Number(p.longitude) };
    return null;
  };

  const normPickup = useMemo(() => normalizePoint(pickup), [pickup]);
  const normDrop = useMemo(() => normalizePoint(drop), [drop]);
  const normDriver = useMemo(() => normalizePoint(driver), [driver]);
  const normRoutePoints = useMemo(() => (routePoints || []).map(normalizePoint).filter(Boolean), [routePoints]);

  const allPoints = [normPickup, normDrop, normDriver, ...normRoutePoints].filter(Boolean);
  const autoRegion = useMemo(() => getMapRegion(allPoints), [allPoints]);
  
  const internalRef = useRef(null);
  const ref = mapRef || internalRef;

  useEffect(() => {
    if (ref.current && allPoints.length > 0) {
      ref.current.fitToCoordinates(allPoints, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [allPoints]);

  const isWeb = Platform.OS === 'web';
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
        ref={ref}
        style={styles.map}
        initialRegion={{
          latitude: autoRegion.latitude,
          longitude: autoRegion.longitude,
          latitudeDelta: Math.max(0.01, 180 / Math.pow(2, autoRegion.zoom)),
          longitudeDelta: Math.max(0.01, 360 / Math.pow(2, autoRegion.zoom)),
        }}
        mapType="none"
        minZoomLevel={MIN_ZOOM}
        maxZoomLevel={MAX_ZOOM}
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
        
        {normRoutePoints.length > 0 && (
          <Polyline
            coordinates={normRoutePoints}
            strokeColor={COLORS.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
        
        {normPickup && (
          <Marker coordinate={normPickup} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
          </Marker>
        )}
        
        {normDrop && (
          <Marker coordinate={normDrop} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
          </Marker>
        )}
        
        {normDriver && (
          <Marker coordinate={normDriver} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.dot, { backgroundColor: COLORS.accentOrange, width: 14, height: 14, borderRadius: 7 }]} />
          </Marker>
        )}
        
        {children}
      </MapView>

      <View style={styles.attribution}>
        <Text style={styles.attributionText}>© OpenStreetMap, © CARTO</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#E5E3DF",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  dot: {
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
  attribution: {
    position: "absolute",
    right: 10,
    bottom: 10,
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
