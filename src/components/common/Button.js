
import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING } from "../../constants";

export default function Button({ title, onPress, variant = "primary", size = "md", loading = false, disabled = false, icon, style }) {
  const isOutline = variant === "outline";
  const isDanger = variant === "danger";
  const isGhost = variant === "ghost";

  if (isOutline || isGhost) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.base,
          styles[size],
          isOutline && styles.outline,
          isGhost && styles.ghost,
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="small" />
        ) : (
          <View style={styles.row}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.text, isOutline && styles.outlineText, isGhost && styles.ghostText]}>
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  const gradients = {
    primary: [COLORS.primary, COLORS.primaryDark],
    danger: [COLORS.error, "#C0392B"],
    success: [COLORS.success, "#059669"],
    warning: [COLORS.warning, "#D97706"],
  };
  const grad = gradients[variant] || gradients.primary;

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} style={[styles.shadow, style]} activeOpacity={0.85}>
      <LinearGradient colors={disabled ? [COLORS.gray, COLORS.grayDark] : grad} style={[styles.base, styles[size], styles.gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        {loading ? (
          <ActivityIndicator color={COLORS.white} size="small" />
        ) : (
          <View style={styles.row}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.text, styles.primaryText]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 14, alignItems: "center", justifyContent: "center" },
  gradient: {},
  shadow: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  sm: { paddingVertical: 10, paddingHorizontal: 18 },
  md: { paddingVertical: 14, paddingHorizontal: 24 },
  lg: { paddingVertical: 18, paddingHorizontal: 32 },
  outline: { borderWidth: 2, borderColor: COLORS.primary, backgroundColor: "transparent" },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  primaryText: { color: COLORS.white },
  outlineText: { color: COLORS.primary },
  ghostText: { color: COLORS.primary },
  row: { flexDirection: "row", alignItems: "center" },
  iconWrap: { marginRight: 8 },
});
