
import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, RADIUS, SHADOWS } from "../../constants";

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
    primary: [COLORS.primary, "#2563EB"],
    danger: [COLORS.error, "#B91C1C"],
    success: [COLORS.success, "#0B7A5D"],
    warning: [COLORS.warning, "#D97706"],
  };
  const grad = gradients[variant] || gradients.primary;

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} style={[styles.shadow, style]} activeOpacity={0.9}>
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
  base: { borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  gradient: { minHeight: 52 },
  shadow: { ...SHADOWS.soft },
  sm: { paddingVertical: 10, paddingHorizontal: 18, minHeight: 42 },
  md: { paddingVertical: 14, paddingHorizontal: 24, minHeight: 52 },
  lg: { paddingVertical: 18, paddingHorizontal: 32, minHeight: 58 },
  outline: { borderWidth: 1.5, borderColor: COLORS.borderStrong, backgroundColor: COLORS.white },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: "700", letterSpacing: 0.2 },
  primaryText: { color: COLORS.white },
  outlineText: { color: COLORS.text },
  ghostText: { color: COLORS.primary, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center" },
  iconWrap: { marginRight: 8 },
});
