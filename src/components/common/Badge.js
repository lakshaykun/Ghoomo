
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "../../constants";

const statusConfig = {
  pending: { bg: "#FFF4DB", text: "#9A6700", label: "Pending" },
  accepted: { bg: "#E4EEFF", text: "#1D4ED8", label: "Accepted" },
  in_progress: { bg: "#E3F8F2", text: "#0F7660", label: "In Progress" },
  completed: { bg: "#E3F8F2", text: "#0F7660", label: "Completed" },
  cancelled: { bg: "#FDE8E8", text: "#B91C1C", label: "Cancelled" },
  waiting: { bg: "#FCEED8", text: "#B45309", label: "Waiting" },
  arrived: { bg: "#E4EEFF", text: "#1D4ED8", label: "Arrived" },
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
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill, alignSelf: "flex-start" },
  text: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
});
