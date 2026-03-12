
import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS, RADIUS, SHADOWS, SPACING } from "../../constants";

export default function Card({ children, style, elevated = false }) {
  return (
    <View style={[styles.card, elevated && styles.elevated, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  elevated: {
    ...SHADOWS.card,
    borderWidth: 0,
  },
});
