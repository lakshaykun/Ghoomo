
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../store/slices/authSlice";
import Button from "../../components/common/Button";
import { COLORS, RADIUS, SHADOWS, SPACING } from "../../constants";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(s => s.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    dispatch(loginUser(email.trim().toLowerCase(), password));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.scroll}>
          <View style={styles.hero}>
            <View style={styles.bgOrb} pointerEvents="none" />
            <View style={styles.bgOrbAlt} pointerEvents="none" />
            <View style={styles.logoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="car-sport" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.appName}>Ghoomo</Text>
            </View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.sub}>Sign in to manage rides, track trips, and keep campus transport flowing.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign in</Text>
            <Text style={styles.formSub}>Use your registered email and password.</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail" size={20} color={COLORS.gray} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.gray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed" size={20} color={COLORS.gray} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor={COLORS.gray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textContentType="password"
                  returnKeyType="done"
                />
              </View>
            </View>
            {error && <Text style={styles.error}>{error}</Text>}

            <Button title="Sign In" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />

            <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.grayLight },
  scroll: { flex: 1, paddingBottom: SPACING.xl },
  hero: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl + 4, paddingBottom: SPACING.lg, overflow: "hidden" },
  bgOrb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#DBEAFE",
    top: -70,
    right: -60,
  },
  bgOrbAlt: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#F1F5F9",
    bottom: -40,
    left: -30,
  },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.md },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  appName: { fontSize: 28, fontWeight: "900", color: COLORS.text, letterSpacing: 0.4 },
  greeting: { fontSize: 26, fontWeight: "900", color: COLORS.text, marginBottom: 6, lineHeight: 32 },
  sub: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, maxWidth: 340 },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    flex: 1,
    minHeight: 420,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  formTitle: { fontSize: 22, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  formSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.lg, lineHeight: 19 },
  error: { color: COLORS.error, fontSize: 13, textAlign: "center", marginBottom: 8, fontWeight: "600" },
  field: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.text, marginBottom: 8, letterSpacing: 0.2 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  registerRow: { flexDirection: "row", justifyContent: "center", marginTop: SPACING.md, paddingBottom: SPACING.md },
  registerText: { fontSize: 14, color: COLORS.textSecondary },
  registerLink: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
});
