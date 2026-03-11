
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING } from "../../constants";

export default function Header({ title, subtitle, onBack, rightComponent, transparent = false }) {
  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, transparent && styles.transparent]}>
      <View style={styles.container}>
        <View style={styles.left}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
          )}
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        {rightComponent && <View style={styles.right}>{rightComponent}</View>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.white },
  transparent: { backgroundColor: "transparent" },
  container: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, paddingVertical: 12 },
  left: { flexDirection: "row", alignItems: "center", flex: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.grayLight, alignItems: "center", justifyContent: "center", marginRight: SPACING.sm },
  titleWrap: { flex: 1 },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  right: {},
});
