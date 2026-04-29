import React, { useMemo, useRef, useEffect, useState } from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import MapView, { Marker, Polyline, UrlTile } from "react-native-maps";
import { COLORS } from "../../constants";
import { getMapRegion } from "../../utils/map";

const MIN_ZOOM = 9;
const MAX_ZOOM = 18;
const EMPTY_ROUTE_POINTS = [];

export default function OsmRouteMap({ pickup, drop, driver, routePoints = EMPTY_ROUTE_POINTS, style, children, onRegionChangeComplete, mapRef }) {
  const [routeLine, setRouteLine] = useState([]);
  const normalizePoint = (p) => {
    if (!p) return null;
    let lat, lon;
    if (Array.isArray(p) && p.length >= 2) {
      lon = Number(p[0]);
      lat = Number(p[1]);
    } else if (p.lat !== undefined && p.lng !== undefined) {
      lat = Number(p.lat);
      lon = Number(p.lng);
    } else if (p.latitude !== undefined && p.longitude !== undefined) {
      lat = Number(p.latitude);
      lon = Number(p.longitude);
    }
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { latitude: lat, longitude: lon };
    }
    return null;
  };

  const normPickup = useMemo(() => normalizePoint(pickup), [pickup]);
  const normDrop = useMemo(() => normalizePoint(drop), [drop]);
  const normDriver = useMemo(() => normalizePoint(driver), [driver]);
  const normRoutePoints = useMemo(() => {
    let pts = routePoints || [];
    if (!Array.isArray(pts)) {
      pts = pts.coordinates || pts.geometry?.coordinates || pts.geometry || [];
      if (!Array.isArray(pts)) pts = [];
    }
    return pts.map(normalizePoint).filter(Boolean);
  }, [routePoints]);

  const hasExternalRoute = normRoutePoints.length > 1;

  useEffect(() => {
    if (hasExternalRoute) {
      setRouteLine(normRoutePoints);
      return;
    }

    if (!normPickup || !normDrop) {
      setRouteLine([]);
      return;
    }

    const controller = new AbortController();

    async function loadRoute() {
      try {
        const url = new URL("https://router.project-osrm.org/route/v1/driving");
        url.pathname = "/route/v1/driving";
        url.searchParams.set(
          "coordinates",
          `${normPickup.longitude},${normPickup.latitude};${normDrop.longitude},${normDrop.latitude}`
        );
        url.searchParams.set("overview", "full");
        url.searchParams.set("geometries", "geojson");
        url.searchParams.set("steps", "false");

        const response = await fetch(url.toString(), { signal: controller.signal });
        if (!response.ok) throw new Error(`Route request failed with HTTP ${response.status}`);

        const payload = await response.json();
        const coordinates = payload?.routes?.[0]?.geometry?.coordinates || [];
        if (!Array.isArray(coordinates) || coordinates.length < 2) {
          setRouteLine([]);
          return;
        }

        setRouteLine(coordinates.map(normalizePoint).filter(Boolean));
      } catch {
        setRouteLine([]);
      }
    }

    loadRoute();

    return () => controller.abort();
  }, [hasExternalRoute, normPickup, normDrop, normRoutePoints]);

  const allPoints = useMemo(
    () => [normPickup, normDrop, normDriver, ...(routeLine.length > 1 ? routeLine : normRoutePoints)].filter(Boolean),
    [normPickup, normDrop, normDriver, routeLine, normRoutePoints]
  );

  const autoRegion = useMemo(() => {
    const res = getMapRegion(allPoints);
    return {
      latitude: Number(res.latitude) || 30.7333,
      longitude: Number(res.longitude) || 76.7794,
      zoom: Number(res.zoom) || 13
    };
  }, [allPoints]);
  
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

  if (!autoRegion || !autoRegion.latitude || !autoRegion.longitude) {
    return (
      <View style={[styles.wrapper, style, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.textSecondary }}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      <MapView
        ref={ref}
        style={styles.map}
        initialRegion={{
          latitude: Number(autoRegion.latitude),
          longitude: Number(autoRegion.longitude),
          latitudeDelta: Number(Math.max(0.01, 180 / Math.pow(2, autoRegion.zoom))),
          longitudeDelta: Number(Math.max(0.01, 360 / Math.pow(2, autoRegion.zoom))),
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
        
        {(routeLine.length > 1 || normRoutePoints.length > 1) && (
          <Polyline
            coordinates={routeLine.length > 1 ? routeLine : normRoutePoints}
            strokeColor="rgba(255,255,255,0.95)"
            strokeWidth={8}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {(routeLine.length > 1 || normRoutePoints.length > 1) && (
          <Polyline
            coordinates={routeLine.length > 1 ? routeLine : normRoutePoints}
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
