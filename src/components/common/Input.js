
import React, { useEffect, useState } from "react";
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SHADOWS, SPACING } from "../../constants";

function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  leftIcon,
  rightIcon,
  error,
  multiline,
  editable = true,
  style,
  inputRef,
  ...textInputProps
}) {
  const [secure, setSecure] = useState(secureTextEntry || false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setSecure(Boolean(secureTextEntry));
  }, [secureTextEntry]);

  const handleFocus = (event) => {
    setFocused(true);
    if (textInputProps.onFocus) {
      textInputProps.onFocus(event);
    }
  };

  const handleBlur = (event) => {
    setFocused(false);
    if (textInputProps.onBlur) {
      textInputProps.onBlur(event);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, focused && styles.focused, error && styles.errorBorder, !editable && styles.disabled]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          {...textInputProps}
          ref={inputRef}
          style={[styles.input, leftIcon && styles.inputWithLeft, (secureTextEntry || rightIcon) && styles.inputWithRight, multiline && styles.multiline]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          value={value ?? ""}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          keyboardType={keyboardType || "default"}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          editable={editable}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setSecure(!secure)} style={styles.rightIcon}>
            <Ionicons name={secure ? "eye-off" : "eye"} size={20} color={COLORS.gray} />
          </TouchableOpacity>
        )}
        {!secureTextEntry && rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export default React.memo(Input);

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.text, marginBottom: 8, letterSpacing: 0.2 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  focused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    ...SHADOWS.soft,
  },
  errorBorder: { borderColor: COLORS.error },
  disabled: { opacity: 0.6 },
  input: { flex: 1, paddingVertical: 15, paddingHorizontal: 16, fontSize: 15, color: COLORS.text },
  inputWithLeft: { paddingLeft: 8 },
  inputWithRight: { paddingRight: 8 },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  leftIcon: { paddingLeft: 14 },
  rightIcon: { paddingRight: 14 },
  error: { fontSize: 12, color: COLORS.error, marginTop: 6, marginLeft: 4, fontWeight: "600" },
});
