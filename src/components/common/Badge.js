
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants";

const statusConfig = {
  pending: { bg: "#FEF3C7", text: "#92400E", label: "Pending" },
  accepted: { bg: "#DBEAFE", text: "#1E40AF", label: "Accepted" },
  in_progress: { bg: "#D1FAE5", text: "#065F46", label: "In Progress" },
  completed: { bg: "#D1FAE5", text: "#065F46", label: "Completed" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B", label: "Cancelled" },
  waiting: { bg: "#F3E8FF", text: "#6B21A8", label: "Waiting" },
  arrived: { bg: "#DBEAFE", text: "#1E40AF", label: "Arrived" },
  default: { bg: COLORS.grayLight, text: COLORS.grayDark, label: "" },
};

export default function Badge({ status, label, color }) {
  const config = statusConfig[status] || statusConfig.default;
  const displayLabel = label || config.label || status;
  const bg = color ? color + "20" : config.bg;
  const textColor = color || config.text;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: textColor }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  text: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
});
