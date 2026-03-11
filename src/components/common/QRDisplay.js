
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, G } from "react-native-svg";
import { COLORS, SPACING } from "../../constants";

function generateQRMatrix(data) {
  const size = 21;
  const matrix = Array(size).fill(null).map(() => Array(size).fill(0));
  const str = typeof data === "string" ? data : JSON.stringify(data);
  for (let i = 0; i < str.length && i < size * size; i++) {
    const row = Math.floor(i / size);
    const col = i % size;
    matrix[row][col] = str.charCodeAt(i) % 2;
  }
  // Fixed patterns (corners)
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
        matrix[r][c] = 1;
        matrix[r][size - 1 - c] = 1;
        matrix[size - 1 - r][c] = 1;
      }
    }
  }
  return matrix;
}

export default function QRDisplay({ data, size = 180, label }) {
  const matrix = generateQRMatrix(data);
  const cellSize = size / 21;

  return (
    <View style={styles.container}>
      <View style={[styles.qrWrap, { width: size + 24, height: size + 24 }]}>
        <Svg width={size} height={size}>
          <Rect width={size} height={size} fill="white" />
          <G>
            {matrix.map((row, r) =>
              row.map((cell, c) =>
                cell ? <Rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill={COLORS.black} rx={1} /> : null
              )
            )}
          </G>
        </Svg>
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  qrWrap: { backgroundColor: COLORS.white, borderRadius: 16, padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, alignItems: "center", justifyContent: "center" },
  label: { marginTop: 10, fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
});
