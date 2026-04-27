import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/common/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { COLORS, RADIUS, SPACING } from "../../constants";
import { api } from "../../services/api";

function Field({ label, value, onChangeText, placeholder, multiline = false }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        multiline={multiline}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

export default function SavedLocationsScreen({ navigation, route }) {
  const rideType = String(route.params?.rideType || "cab");
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const { locations: rows } = await api.getSavedLocations();
      setLocations(rows || []);
    } catch (error) {
      Alert.alert("Unable to load saved locations", error.message || "Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const useCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission is required to save a place from your current location.");
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setCoords(nextCoords);

      try {
        const { place } = await api.reverseGeocode(nextCoords);
        setAddress(place.address || place.name || "");
        if (!name.trim()) {
          setName(place.name || "Saved location");
        }
      } catch {
        setAddress(`${nextCoords.latitude.toFixed(5)}, ${nextCoords.longitude.toFixed(5)}`);
      }
    } catch (error) {
      Alert.alert("Current location unavailable", error.message || "Unable to read your current location.");
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !address.trim() || !coords) {
      Alert.alert("Missing details", "Use your current location first, then add a name for the place.");
      return;
    }

    setSaving(true);
    try {
      await api.addSavedLocation({
        name: name.trim(),
        address: address.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setName("");
      setAddress("");
      setCoords(null);
      await loadLocations();
    } catch (error) {
      Alert.alert("Unable to save location", error.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (location) => {
    Alert.alert("Delete Saved Location", `Remove ${location.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.removeSavedLocation(location.id);
            setLocations((current) => current.filter((item) => item.id !== location.id));
          } catch (error) {
            Alert.alert("Unable to delete", error.message || "Please try again.");
          }
        },
      },
    ]);
  };

  const useForBooking = (location, target) => {
    navigation.navigate("BookRide", {
      rideType,
      ...(target === "pickup" ? { presetPickup: location } : { presetDrop: location }),
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Saved Locations" subtitle="Quick access for pickup and drop points" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card elevated style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="bookmark" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryTitle}>{locations.length} saved place{locations.length === 1 ? "" : "s"}</Text>
              <Text style={styles.summaryText}>Use them as pickup or drop points when booking a ride.</Text>
            </View>
          </View>
        </Card>

        <Card elevated style={styles.formCard}>
          <Text style={styles.sectionTitle}>Add location</Text>
          <Field label="Label" value={name} onChangeText={setName} placeholder="Home, Office, Hostel" />
          <Field label="Address" value={address} onChangeText={setAddress} placeholder="Full address" multiline />
          <View style={styles.coordsRow}>
            <Text style={styles.coordsLabel}>
              {coords ? `Coordinates: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : "No coordinates selected yet"}
            </Text>
            <TouchableOpacity style={styles.currentLocationBtn} onPress={useCurrentLocation}>
              <Ionicons name="locate" size={14} color={COLORS.primary} />
              <Text style={styles.currentLocationText}>Use current location</Text>
            </TouchableOpacity>
          </View>
          <Button title={saving ? "Saving..." : "Save Location"} onPress={handleSave} loading={saving} disabled={saving} />
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your places</Text>
          {loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : null}
        </View>

        {locations.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="location-outline" size={28} color={COLORS.gray} />
            </View>
            <Text style={styles.emptyTitle}>No saved locations yet</Text>
            <Text style={styles.emptyText}>Save home, office, hostel, or other frequent places to book faster.</Text>
          </Card>
        ) : (
          locations.map((location) => (
            <Card key={location.id} elevated style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <View style={styles.locationIcon}>
                  <Ionicons name="pin" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.locationBody}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(location)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionChip} onPress={() => useForBooking(location, "pickup")}>
                  <Ionicons name="ellipse" size={12} color={COLORS.success} />
                  <Text style={styles.actionChipText}>Pickup</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionChip} onPress={() => useForBooking(location, "drop")}>
                  <Ionicons name="location" size={12} color={COLORS.error} />
                  <Text style={styles.actionChipText}>Drop</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.md },
  summaryCard: { marginBottom: SPACING.md },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.primary + "12", alignItems: "center", justifyContent: "center" },
  summaryTextWrap: { flex: 1 },
  summaryTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  summaryText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
  formCard: { marginBottom: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.sm },
  fieldBlock: { marginBottom: SPACING.md },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: { minHeight: 84, textAlignVertical: "top" },
  coordsRow: { gap: 10, marginBottom: SPACING.md },
  coordsLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  currentLocationBtn: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary + "12", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  currentLocationText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.sm },
  emptyCard: { alignItems: "center", paddingVertical: 24 },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: COLORS.grayLight, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  emptyText: { fontSize: 12, color: COLORS.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 18 },
  locationCard: { marginBottom: SPACING.sm },
  locationHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  locationIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.primary + "12", alignItems: "center", justifyContent: "center" },
  locationBody: { flex: 1 },
  locationName: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  locationAddress: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.error + "10" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, paddingVertical: 10 },
  actionChipText: { fontSize: 12, fontWeight: "800", color: COLORS.text },
});
