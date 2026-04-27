import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from "react-native";
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from "../../constants";

export default function Button({ title, onPress, variant = "primary", size = "md", loading = false, disabled = false, icon, style }) {
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";

  const getBackgroundColor = () => {
    if (disabled) return COLORS.grayLight;
    if (isOutline || isGhost) return "transparent";
    switch (variant) {
      case "danger": return COLORS.error;
      case "success": return COLORS.success;
      case "warning": return COLORS.warning;
      case "secondary": return COLORS.grayLight;
      default: return COLORS.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return COLORS.grayDark;
    if (isOutline || isGhost) {
      if (variant === "danger") return COLORS.error;
      return COLORS.primary;
    }
    if (variant === "secondary") return COLORS.text;
    return COLORS.white;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[size],
        isOutline && styles.outline,
        !isOutline && !isGhost && !disabled && styles.shadow,
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor() }]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  shadow: { ...SHADOWS.soft },
  sm: { paddingVertical: 10, paddingHorizontal: 16, minHeight: 40 },
  md: { paddingVertical: 14, paddingHorizontal: 20, minHeight: 48 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 56 },
  outline: {
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
  },
  text: {
    ...TYPOGRAPHY.body,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  row: { flexDirection: "row", alignItems: "center" },
  iconWrap: { marginRight: 8 },
});
