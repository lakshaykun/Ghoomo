import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, UrlTile } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as ExpoLocation from "expo-location";
import { api } from "../../services/api";
import { getPopularPlaces } from "../../modules/api/popularPlacesAPI";
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from "../../constants";

const { height: SCREEN_H } = Dimensions.get("window");
const DEBOUNCE_MS = 380;
const MIN_ZOOM = 9;
const MAX_ZOOM = 18;
const DEFAULT_REGION = { latitude: 28.6139, longitude: 77.209, latitudeDelta: 0.05, longitudeDelta: 0.05 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback(
    (...args) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

function normalizePlace(p) {
  if (!p) return null;
  if (p.latitude != null && p.longitude != null) return p;
  if (p.lat != null && p.lng != null) return { ...p, latitude: Number(p.lat), longitude: Number(p.lng) };
  return null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function LocationInput({
  field,
  isActive,
  value,
  onFocus,
  onChangeText,
  onUseMyLocation,
  onOpenPopular,
  searching,
  locked,
}) {
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, field === "pickup" ? COLORS.success : COLORS.error],
  });

  return (
    <Animated.View style={[styles.inputRow, { borderColor }]}>
      <View style={styles.fieldDot}>
        <View
          style={[
            styles.dot,
            { backgroundColor: field === "pickup" ? COLORS.success : COLORS.error },
          ]}
        />
      </View>
      <TextInput
        style={styles.inputText}
        value={value}
        placeholder={field === "pickup" ? "Pickup location" : "Drop location"}
        placeholderTextColor={COLORS.gray}
        onFocus={onFocus}
        onChangeText={onChangeText}
        returnKeyType="search"
        editable={!locked}
      />
      {searching ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />
      ) : null}
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={onUseMyLocation}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="locate" size={20} color={isActive ? COLORS.primary : COLORS.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={onOpenPopular}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="star" size={18} color={isActive ? "#F59E0B" : COLORS.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function SuggestionList({ items, onSelect, onDismiss }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.suggestionBox}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="always"
        ItemSeparatorComponent={() => <View style={styles.suggestionSep} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.suggestionRow} onPress={() => onSelect(item)}>
            <Ionicons name="location-outline" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.suggestionText} numberOfLines={2}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.suggestionDismiss} onPress={onDismiss}>
        <Text style={styles.suggestionDismissText}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}

function PopularPlacesModal({ visible, onClose, onSelect }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    getPopularPlaces()
      .then((data) => { if (!cancelled) setPlaces(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.popularSheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.popularTitle}>Popular Places</Text>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 32 }} />
        ) : places.length === 0 ? (
          <Text style={{ textAlign: 'center', color: COLORS.textSecondary, paddingVertical: 24, ...TYPOGRAPHY.body }}>
            No popular places configured yet.
          </Text>
        ) : (
          <FlatList
            data={places}
            keyExtractor={(item) => String(item.id)}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.border }} />}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.popularRow} onPress={() => onSelect(item)}>
                <View style={styles.popularIcon}>
                  <Ionicons name="business-outline" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.popularText}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          />
        )}
        <TouchableOpacity style={styles.popularClose} onPress={onClose}>
          <Text style={styles.popularCloseText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function MarkerDot({ color, isActive }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scale.setValue(1);
    }
  }, [isActive]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <View style={[styles.markerOuter, { borderColor: color }]}>
        <View style={[styles.markerInner, { backgroundColor: color }]} />
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function LocationPicker({
  initialPickup = null,
  initialDrop = null,
  onPickupChange,
  onDropChange,
  routePoints = [],
  style,
}) {
  const [activeField, setActiveField] = useState("pickup");
  const [pickup, setPickup] = useState(() => normalizePlace(initialPickup));
  const [drop, setDrop] = useState(() => normalizePlace(initialDrop));
  const [pickupText, setPickupText] = useState(initialPickup?.name || "");
  const [dropText, setDropText] = useState(initialDrop?.name || "");

  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(null); // 'pickup' | 'drop' | null
  const [isCalibrating, setIsCalibrating] = useState(false); // user is moving map
  const [showPopular, setShowPopular] = useState(false);
  const [popularFor, setPopularFor] = useState(null);

  // ── Refs ──
  const mapRef = useRef(null);
  const geocodeTimer = useRef(null);
  const isProgrammaticRef = useRef(true); // Start true to skip initialRegion auto-fetch
  const skipNextReverseGeocodeRef = useRef(false);

  // Sheet slide-up animation
  const sheetAnim = useRef(new Animated.Value(0)).current;

  // ── Animate sheet on mount ────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(sheetAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);


  // ── Sync callbacks ─────────────────────────────────────────────────────────
  useEffect(() => { onPickupChange?.(pickup); }, [pickup]);
  useEffect(() => { onDropChange?.(drop); }, [drop]);

  // ── Internal setter that keeps text + place in sync ──────────────────────
  function applyPlace(field, place) {
    if (field === "pickup") {
      setPickup(place);
      setPickupText(place.name || place.address || "");
    } else {
      setDrop(place);
      setDropText(place.name || place.address || "");
    }
    setSuggestions([]);
    animateTo(place);
  }

  // ── Smooth map animation ──────────────────────────────────────────────────
  function animateTo(place, delta = 0.012) {
    if (!place || !mapRef.current) return;
    isProgrammaticRef.current = true;
    mapRef.current.animateToRegion(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      },
      600
    );
  }

  // ── Method 1: Use current location ───────────────────────────────────────
  async function handleUseMyLocation(field) {
    setIsGeolocating(field);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setIsGeolocating(null);
        return;
      }
      const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      const { place } = await api.reverseGeocode(coords);
      applyPlace(field, place);
    } catch {
      // silently fail — user stays where they are
    } finally {
      setIsGeolocating(null);
    }
  }

  // ── Method 2: Text search ─────────────────────────────────────────────────
  const doSearch = useCallback(async (text, field) => {
    if (text.trim().length < 2) { setSuggestions([]); return; }
    setIsSearching(true);
    try {
      const coord = field === "pickup" ? (drop || pickup) : (pickup || drop);
      const { places } = await api.searchPlaces({
        query: text.trim(),
        latitude: coord?.latitude,
        longitude: coord?.longitude,
      });
      setSuggestions(places);
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, [pickup, drop]);

  const debouncedSearch = useDebounce(doSearch, DEBOUNCE_MS);

  function handleTextChange(field, text) {
    if (field === "pickup") setPickupText(text);
    else setDropText(text);
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debouncedSearch(text, field);
  }

  // ── Method 3: Popular places ──────────────────────────────────────────────
  function handleOpenPopular(field) {
    setPopularFor(field);
    setShowPopular(true);
  }

  function handlePopularSelect(place) {
    setShowPopular(false);
    skipNextReverseGeocodeRef.current = true;
    applyPlace(popularFor, place);
  }

  // ── Method 4: Map calibration ─────────────────────────────────────────────
  function handleRegionChangeComplete(region) {
    setIsCalibrating(false);

    // If the region changed because of animateTo() or initial load, skip reverse geocoding
    if (isProgrammaticRef.current) {
      isProgrammaticRef.current = false;
      return;
    }

    if (skipNextReverseGeocodeRef.current) {
      skipNextReverseGeocodeRef.current = false;
      return;
    }

    // Debounce reverse geocode so we don't hammer the API on every frame
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      try {
        const { place } = await api.reverseGeocode({
          latitude: region.latitude,
          longitude: region.longitude,
        });
        if (activeField === "pickup") {
          setPickup(place);
          setPickupText(place.name || place.address || "");
        } else {
          setDrop(place);
          setDropText(place.name || place.address || "");
        }
      } catch {
        // silently keep whatever coordinates we got
        const partial = { latitude: region.latitude, longitude: region.longitude, name: "Pinned location" };
        if (activeField === "pickup") {
          setPickup(partial);
          setPickupText("Pinned location");
        } else {
          setDrop(partial);
          setDropText("Pinned location");
        }
      }
    }, 400);
  }

  // ── Compute initial region ────────────────────────────────────────────────
  const mapRegion = (() => {
    const anchor = pickup || drop;
    if (!anchor) return DEFAULT_REGION;
    return {
      latitude: anchor.latitude,
      longitude: anchor.longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  })();

  const activeColor = activeField === "pickup" ? COLORS.success : COLORS.error;
  const sheetTranslate = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] });

  return (
    <View style={[styles.container, style]}>
      {/* ── MAP ── */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={mapRegion}
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
          onRegionChangeComplete={handleRegionChangeComplete}
          onRegionChange={() => setIsCalibrating(true)}
        >
          <UrlTile
            urlTemplate="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />

          {routePoints.length > 1 && (
            <Polyline
              coordinates={routePoints}
              strokeColor={COLORS.primary}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {pickup && (
            <Marker coordinate={pickup} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <MarkerDot color={COLORS.success} isActive={activeField === "pickup"} />
            </Marker>
          )}

          {drop && (
            <Marker coordinate={drop} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <MarkerDot color={COLORS.error} isActive={activeField === "drop"} />
            </Marker>
          )}
        </MapView>

        {/* Center calibration pin */}
        <View style={styles.centerPin} pointerEvents="none">
          <View style={[styles.pinShadow, { opacity: isCalibrating ? 0.5 : 0.15 }]} />
          <Ionicons
            name="location"
            size={40}
            color={activeColor}
            style={[styles.pinIcon, { transform: [{ translateY: isCalibrating ? -6 : 0 }] }]}
          />
        </View>

        {/* Calibrating badge */}
        {isCalibrating && (
          <View style={styles.calibratingBadge}>
            <ActivityIndicator size="small" color={COLORS.white} />
            <Text style={styles.calibratingText}>Move to refine</Text>
          </View>
        )}

        {/* Recenter FAB */}
        <TouchableOpacity
          style={styles.recenterFab}
          onPress={() => {
            const anchor = activeField === "pickup" ? pickup : drop;
            if (anchor) animateTo(anchor);
          }}
        >
          <Ionicons name="locate-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Attribution */}
        <View style={styles.attribution}>
          <Text style={styles.attributionText}>© OpenStreetMap, © CARTO</Text>
        </View>
      </View>

      {/* ── BOTTOM SHEET ── */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslate }] }]}>
        <View style={styles.sheetHandle} />

        <Text style={styles.sheetTitle}>
          Setting{" "}
          <Text style={{ color: activeColor }}>
            {activeField === "pickup" ? "Pickup" : "Drop"}
          </Text>{" "}
          location
        </Text>

        {/* Pickup field */}
        <LocationInput
          field="pickup"
          isActive={activeField === "pickup"}
          value={pickupText}
          onFocus={() => {
            setActiveField("pickup");
            setSuggestions([]);
            if (pickup) animateTo(pickup);
          }}
          onChangeText={(t) => handleTextChange("pickup", t)}
          onUseMyLocation={() => handleUseMyLocation("pickup")}
          onOpenPopular={() => handleOpenPopular("pickup")}
          searching={isGeolocating === "pickup" || (isSearching && activeField === "pickup")}
        />

        {/* Drop field */}
        <View style={{ marginTop: SPACING.sm }}>
          <LocationInput
            field="drop"
            isActive={activeField === "drop"}
            value={dropText}
            onFocus={() => {
              setActiveField("drop");
              setSuggestions([]);
              if (drop) animateTo(drop);
            }}
            onChangeText={(t) => handleTextChange("drop", t)}
            onUseMyLocation={() => handleUseMyLocation("drop")}
            onOpenPopular={() => handleOpenPopular("drop")}
            searching={isGeolocating === "drop" || (isSearching && activeField === "drop")}
          />
        </View>

        {/* Suggestions list — only shown for active field */}
        <SuggestionList
          items={suggestions}
          onSelect={(place) => applyPlace(activeField, place)}
          onDismiss={() => setSuggestions([])}
        />

        {/* Route summary row */}
        {pickup && drop && (
          <View style={styles.routeSummary}>
            <Ionicons name="navigate" size={16} color={COLORS.primary} />
            <Text style={styles.routeSummaryText} numberOfLines={1}>
              {pickup.name || "Pickup"} → {drop.name || "Drop"}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Popular Places Modal */}
      <PopularPlacesModal
        visible={showPopular}
        onClose={() => setShowPopular(false)}
        onSelect={handlePopularSelect}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapArea: {
    flex: 1,
    minHeight: 260,
  },
  // ── Center pin ──
  centerPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -40,
    alignItems: "center",
  },
  pinShadow: {
    position: "absolute",
    bottom: -2,
    width: 12,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#000",
  },
  pinIcon: {
    // The Ionicons location icon baseline sits at the bottom of the glyph
  },
  // ── Calibrating badge ──
  calibratingBadge: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,23,42,0.82)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  calibratingText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  // ── Recenter FAB ──
  recenterFab: {
    position: "absolute",
    right: 14,
    bottom: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.card,
  },
  // ── Attribution ──
  attribution: {
    position: "absolute",
    left: 8,
    bottom: 8,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  attributionText: { fontSize: 9, color: COLORS.textSecondary },
  // ── Sheet ──
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === "ios" ? 32 : SPACING.lg,
    ...SHADOWS.card,
    // min height ~30% of screen
    minHeight: SCREEN_H * 0.3,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: SPACING.md,
  },
  sheetTitle: {
    ...TYPOGRAPHY.subtitle,
    marginBottom: SPACING.md,
  },
  // ── Input row ──
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg || "#F5F7FA",
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.sm,
    minHeight: 50,
  },
  fieldDot: {
    marginRight: SPACING.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  inputText: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    paddingVertical: 8,
  },
  iconBtn: {
    padding: 6,
  },
  // ── Suggestions ──
  suggestionBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
    maxHeight: 220,
    overflow: "hidden",
    ...SHADOWS.soft,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  suggestionText: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  suggestionSep: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  suggestionDismiss: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: "center",
    paddingVertical: 10,
  },
  suggestionDismissText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
  },
  // ── Route summary ──
  routeSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: SPACING.md,
    backgroundColor: COLORS.primaryLight + "20",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  routeSummaryText: {
    flex: 1,
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    fontWeight: "600",
  },
  // ── Marker dot ──
  markerOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },
  markerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // ── Popular places modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  popularSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom: Platform.OS === "ios" ? 34 : SPACING.xl,
    maxHeight: SCREEN_H * 0.65,
    ...SHADOWS.card,
  },
  popularTitle: {
    ...TYPOGRAPHY.subtitle,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  popularRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
  },
  popularIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  popularText: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  popularClose: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.border + "80",
    alignItems: "center",
  },
  popularCloseText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
});
