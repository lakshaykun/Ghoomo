
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, googleSignIn } from "../../store/slices/authSlice";
import Button from "../../components/common/Button";
import { COLORS, RADIUS, SHADOWS, SPACING } from "../../constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGoogleAuthRequest } from "../../services/firebaseAuth";

const ROLE_OPTIONS = [
  { key: "user", label: "User", icon: "person", help: "Book rides and buses" },
  { key: "driver", label: "Driver", icon: "car", help: "Drive bike, auto, cab, or bus" },
  { key: "admin", label: "Admin", icon: "shield-checkmark", help: "Manage the platform" },
];

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(s => s.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleSignInModal, setShowGoogleSignInModal] = useState(false);
  const [selectedRoleForGoogle, setSelectedRoleForGoogle] = useState("user");
  const { promptAsync } = useGoogleAuthRequest();

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    dispatch(loginUser(email.trim().toLowerCase(), password));
  };

  const handleGoogleSignInClick = () => {
    setShowGoogleSignInModal(true);
  };

  const handleGoogleSignIn = async () => {
    if (!promptAsync) {
      Alert.alert("Error", "Google sign-in is not available at the moment");
      return;
    }

    setGoogleLoading(true);
    try {
      dispatch(googleSignIn(promptAsync, selectedRoleForGoogle));
      setShowGoogleSignInModal(false);
    } catch (err) {
      Alert.alert("Error", err.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
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

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, googleLoading && styles.googleButtonDisabled]}
              onPress={handleGoogleSignInClick}
              disabled={googleLoading}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator color={COLORS.text} size="small" />
              ) : (
                <>
                  <AntDesign name="google" size={20} color="#EA4335" />
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>

      {showGoogleSignInModal && (
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => !googleLoading && setShowGoogleSignInModal(false)}
            disabled={googleLoading}
          />
          <View style={styles.modalContent} pointerEvents="auto">
            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.modalScrollContent}
              scrollEnabled={true}
            >
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => !googleLoading && setShowGoogleSignInModal(false)}
                disabled={googleLoading}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Select Your Role</Text>
              <Text style={styles.modalSubtitle}>Choose how you want to use Ghoomo</Text>

              <View style={styles.roleSelectGrid}>
                {ROLE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.roleSelectCard,
                      selectedRoleForGoogle === option.key && styles.roleSelectCardActive,
                    ]}
                    onPress={() => !googleLoading && setSelectedRoleForGoogle(option.key)}
                    disabled={googleLoading}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.roleSelectIcon, selectedRoleForGoogle === option.key && styles.roleSelectIconActive]}>
                      <Ionicons
                        name={option.icon}
                        size={24}
                        color={selectedRoleForGoogle === option.key ? COLORS.white : COLORS.primary}
                      />
                    </View>
                    <Text style={styles.roleSelectLabel}>{option.label}</Text>
                    <Text style={styles.roleSelectHelp}>{option.help}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title="Continue with Google"
                onPress={handleGoogleSignIn}
                loading={googleLoading}
                variant="success"
                style={{ marginTop: 16 }}
              />
              <Button
                title="Cancel"
                onPress={() => setShowGoogleSignInModal(false)}
                disabled={googleLoading}
                style={{ marginTop: 12, backgroundColor: COLORS.border }}
              />
            </ScrollView>
          </View>
        </View>
      )}
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
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: SPACING.lg, gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: "#DCDCDC",
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...SHADOWS.soft,
  },
  googleButtonDisabled: { opacity: 0.6 },
  googleButtonText: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  registerRow: { flexDirection: "row", justifyContent: "center", marginTop: SPACING.md, paddingBottom: SPACING.md },
  registerText: { fontSize: 14, color: COLORS.textSecondary },
  registerLink: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    pointerEvents: "box-none",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 0,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: "80%",
    zIndex: 1,
  },
  modalScrollContent: {
    paddingBottom: SPACING.xl,
  },
  modalClose: {
    alignSelf: "flex-end",
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.grayLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  roleSelectGrid: {
    flexDirection: "column",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  roleSelectCard: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.grayLight,
  },
  roleSelectCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#E0F2FE",
  },
  roleSelectIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  roleSelectIconActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleSelectLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  roleSelectHelp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
