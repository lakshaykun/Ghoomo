
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { COLORS, SPACING } from "../../constants";

export default function QRDisplay({ data, size = 180, label }) {
  const value = typeof data === "string" ? data : JSON.stringify(data);

  return (
    <View style={styles.container}>
      <View style={styles.qrWrap}>
        <QRCode value={value} size={size} backgroundColor={COLORS.white} color={COLORS.black} />
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  qrWrap: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  label: { marginTop: 10, fontSize: 13, color: COLORS.textSecondary, fontWeight: "700" },
});
