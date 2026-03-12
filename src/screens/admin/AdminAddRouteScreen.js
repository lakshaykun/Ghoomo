import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { createBusRoute, fetchBusRoutes } from "../../store/slices/busRoutesSlice";
import { fetchAdminDashboard } from "../../store/slices/adminSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Header from "../../components/common/Header";
import { COLORS, SPACING } from "../../constants";
import { sendLocalNotification } from "../../services/notifications";

const INITIAL_ROUTE_FORM = {
  name: "",
  from: "",
  to: "",
  departureTime: "",
  returnTime: "",
  totalSeats: "",
  stops: "",
  days: [],
};

function formatBusTimeInput(value) {
  const raw = String(value || "").toUpperCase().replace(/[^0-9APM]/g, "");
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 4);
  const meridiemSeed = raw.replace(/[0-9]/g, "");
  let formatted = "";

  if (digits.length > 0) {
    formatted += digits.slice(0, 2);
  }
  if (digits.length > 2) {
    formatted += `:${digits.slice(2, 4)}`;
  }

  if (meridiemSeed.startsWith("AM")) {
    formatted += `${formatted ? " " : ""}AM`;
  } else if (meridiemSeed.startsWith("PM")) {
    formatted += `${formatted ? " " : ""}PM`;
  } else if (meridiemSeed === "A" || meridiemSeed === "P") {
    formatted += `${formatted ? " " : ""}${meridiemSeed}`;
  }

  return formatted.trim();
}

function isValidBusTime(value) {
  const match = String(value || "").trim().match(/^(\d{2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return false;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59;
}

function AdminFormInput({ label, multiline = false, containerStyle, style, ...props }) {
  return (
    <View style={[styles.formInputContainer, containerStyle]}>
      <Text style={styles.formInputLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, multiline && styles.formInputMultiline, style]}
        placeholderTextColor={COLORS.gray}
        autoCorrect={false}
        autoCapitalize="none"
        blurOnSubmit={!multiline}
        multiline={multiline}
        {...props}
      />
    </View>
  );
}

export default function AdminAddRouteScreen({ navigation }) {
  const dispatch = useDispatch();
  const { creating } = useSelector((state) => state.busRoutes);
  const [routeForm, setRouteForm] = useState(INITIAL_ROUTE_FORM);

  const updateRouteForm = useCallback((key, value) => {
    setRouteForm((current) => ({ ...current, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (
      !routeForm.name ||
      !routeForm.from ||
      !routeForm.to ||
      !routeForm.departureTime ||
      !routeForm.returnTime ||
      !routeForm.totalSeats ||
      !routeForm.stops
    ) {
      Alert.alert("Missing Details", "Fill all route fields before creating the bus route.");
      return;
    }

    if (!isValidBusTime(routeForm.departureTime) || !isValidBusTime(routeForm.returnTime)) {
      Alert.alert("Invalid Time", "Use the time format hh:mm AM/PM, for example 07:45 AM.");
      return;
    }

    const stopsArray = routeForm.stops
      .split(",")
      .map((stop) => stop.trim())
      .filter(Boolean);
    const uniqueStops = Array.from(new Set(stopsArray));
    if (uniqueStops.length !== stopsArray.length) {
      Alert.alert(
        "Duplicate Stops",
        "Each stop name must be unique in a route. Please remove duplicate stop names."
      );
      return;
    }

    try {
      await dispatch(
        createBusRoute({
          ...routeForm,
          totalSeats: Number(routeForm.totalSeats),
          stops: uniqueStops,
          days: routeForm.days || [],
        })
      );
      await dispatch(fetchBusRoutes()).catch(() => {});
      await dispatch(fetchAdminDashboard()).catch(() => {});

      Alert.alert("Route Added", "The new college bus route is now available across the app.");
      sendLocalNotification({
        key: `admin-route-${routeForm.name}-${routeForm.departureTime}`,
        title: "Bus route added",
        body: `${routeForm.name} is now available for admins, riders, and bus drivers.`,
        data: { routeName: routeForm.name, type: "admin" },
      }).catch(() => {});

      setRouteForm(INITIAL_ROUTE_FORM);
      navigation.goBack();
    } catch (createError) {
      Alert.alert("Unable to Add Route", createError.message || "Please check all route fields and try again.");
    }
  }, [dispatch, navigation, routeForm]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Add Bus Route" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card elevated style={styles.routeFormCard}>
          <Text style={styles.formTitle}>Route Details</Text>
          <AdminFormInput
            label="Route Name"
            placeholder="Route D - Campus to Metro"
            value={routeForm.name}
            onChangeText={(value) => updateRouteForm("name", value)}
            returnKeyType="next"
          />
          <AdminFormInput
            label="From"
            placeholder="Pickup location"
            value={routeForm.from}
            onChangeText={(value) => updateRouteForm("from", value)}
            returnKeyType="next"
          />
          <AdminFormInput
            label="To"
            placeholder="Drop location"
            value={routeForm.to}
            onChangeText={(value) => updateRouteForm("to", value)}
            returnKeyType="next"
          />
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <AdminFormInput
                label="Departure"
                placeholder="07:45 AM"
                value={routeForm.departureTime}
                onChangeText={(value) => updateRouteForm("departureTime", formatBusTimeInput(value))}
                autoCapitalize="characters"
                maxLength={8}
                returnKeyType="next"
              />
            </View>
            <View style={styles.formField}>
              <AdminFormInput
                label="Return"
                placeholder="05:15 PM"
                value={routeForm.returnTime}
                onChangeText={(value) => updateRouteForm("returnTime", formatBusTimeInput(value))}
                autoCapitalize="characters"
                maxLength={8}
                returnKeyType="next"
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <AdminFormInput
                label="Total Seats"
                placeholder="40"
                keyboardType="number-pad"
                value={routeForm.totalSeats}
                onChangeText={(value) => updateRouteForm("totalSeats", value)}
                returnKeyType="next"
              />
            </View>
          </View>
          <AdminFormInput
            label="Stops"
            placeholder="Campus Gate, Library, Market, Metro Station"
            value={routeForm.stops}
            onChangeText={(value) => updateRouteForm("stops", value)}
            multiline
          />
          <View style={styles.formInputContainer}>
            <Text style={styles.formInputLabel}>Operating Days</Text>
            <View style={styles.daysRow}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                const active = routeForm.days.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayChip, active && styles.dayChipActive]}
                    onPress={() =>
                      updateRouteForm(
                        "days",
                        active
                          ? routeForm.days.filter((d) => d !== day)
                          : [...routeForm.days, day]
                      )
                    }
                  >
                    <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <Button title="Add Route" onPress={handleSubmit} loading={creating} variant="success" />
        </Card>
        <View style={{ height: SPACING.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  routeFormCard: { marginBottom: SPACING.md },
  formTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.sm },
  formInputContainer: { marginBottom: SPACING.md },
  formInputLabel: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginBottom: 6, letterSpacing: 0.3 },
  formInput: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  formInputMultiline: { minHeight: 96, textAlignVertical: "top" },
  formRow: { flexDirection: "row", gap: 12 },
  formField: { flex: 1 },
  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
  },
  dayChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  dayChipTextActive: { color: COLORS.white },
});
