
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { logoutUser } from "../../store/slices/authSlice";
import Header from "../../components/common/Header";
import Card from "../../components/common/Card";
import { COLORS, SPACING } from "../../constants";

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const history = useSelector(s => s.booking.bookingHistory);
  const activeBooking = useSelector(s => s.booking.activeBooking);

  const myHistory = useMemo(
    () => history.filter(item => item.userId === user?.id && item.type === "ride"),
    [history, user?.id]
  );
  const completedRides = myHistory.filter(item => item.status === "completed").length;
  const totalSpend = myHistory
    .filter(item => item.status === "completed")
    .reduce((sum, item) => sum + Number(item.fare || 0), 0);
  const totalSavings = myHistory
    .filter(item => item.isShare)
    .reduce((sum, item) => sum + Math.max(0, Math.round((item.distance || 0) * 7)), 0);
  const busBookings = history.filter(item => item.userId === user?.id && item.type === "bus").length;

  const sections = [
    {
      section: "User",
      items: [
        { icon: "mail", label: user?.email || "No email added", color: COLORS.primary },
        { icon: "call", label: user?.phone || "No phone added", color: COLORS.success },
        { icon: "person-circle", label: `Role: ${user?.role || "user"}`, color: COLORS.info },
      ],
    },
    {
      section: "Trips",
      items: [
        { icon: "time", label: `${myHistory.length} total ride bookings`, color: COLORS.info, onPress: () => navigation.navigate("History") },
        { icon: "checkmark-circle", label: `${completedRides} completed rides`, color: COLORS.success, onPress: () => navigation.navigate("History") },
        { icon: "ticket", label: `${busBookings} bus bookings`, color: "#10B981", onPress: () => navigation.navigate("Home", { screen: "BusBooking" }) },
      ],
    },
    {
      section: "Live Status",
      items: [
        {
          icon: activeBooking ? "navigate" : "radio-button-off",
          label: activeBooking ? `Active ride: ${activeBooking.status}` : "No active ride right now",
          color: activeBooking ? COLORS.primary : COLORS.grayDark,
          onPress: activeBooking ? () => navigation.navigate("Home", { screen: "RideTracking" }) : undefined,
        },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => dispatch(logoutUser()) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Profile" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.profileBanner}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.userMeta}>{user?.phone || "Phone not available"}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{completedRides}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>₹{totalSpend}</Text>
              <Text style={styles.statLabel}>Total Spend</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>₹{totalSavings}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Menu */}
        <View style={styles.menuContainer}>
          {sections.map(section => (
            <View key={section.section} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.section}</Text>
              <Card elevated>
                {section.items.map((item, idx) => (
                  <React.Fragment key={item.label}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      disabled={!item.onPress}
                      onPress={item.onPress}
                      activeOpacity={item.onPress ? 0.75 : 1}
                    >
                      <View style={[styles.menuIcon, { backgroundColor: item.color + "20" }]}>
                        <Ionicons name={item.icon} size={18} color={item.color} />
                      </View>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      {item.onPress ? <Ionicons name="chevron-forward" size={16} color={COLORS.gray} /> : null}
                    </TouchableOpacity>
                    {idx < section.items.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))}
              </Card>
            </View>
          ))}

          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out" size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  profileBanner: { padding: SPACING.lg, alignItems: "center", paddingBottom: SPACING.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 12, borderWidth: 3, borderColor: "rgba(255,255,255,0.5)" },
  avatarText: { fontSize: 32, fontWeight: "900", color: COLORS.white },
  name: { fontSize: 22, fontWeight: "800", color: COLORS.white, marginBottom: 4 },
  email: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  userMeta: { fontSize: 13, color: "rgba(255,255,255,0.78)", marginBottom: SPACING.lg },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20, gap: 20 },
  stat: { alignItems: "center", flex: 1 },
  statVal: { fontSize: 18, fontWeight: "900", color: COLORS.white },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  menuContainer: { padding: SPACING.md },
  section: { marginBottom: SPACING.md },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, marginBottom: SPACING.sm, letterSpacing: 0.5, textTransform: "uppercase" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, marginLeft: 12, fontSize: 15, color: COLORS.text, fontWeight: "500" },
  divider: { height: 1, backgroundColor: COLORS.border },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: COLORS.error + "15", borderRadius: 14, paddingVertical: 16, marginTop: 8, marginBottom: 40 },
  logoutText: { fontSize: 16, fontWeight: "700", color: COLORS.error },
});
