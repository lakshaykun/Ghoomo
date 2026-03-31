/**
 * Login Screen – Phone number + OTP verification
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const { sendOTP, verifyOTP } = useAuth();

  const [step, setStep]               = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone]             = useState('');
  const [name, setName]               = useState('');
  const [otp, setOtp]                 = useState('');
  const [isNewUser, setIsNewUser]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [devOtp, setDevOtp]           = useState('');

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      Alert.alert('Error', 'Enter a valid 10-digit phone number');
      return;
    }
    if (isNewUser && !name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    setLoading(true);
    try {
      const data = await sendOTP(`+91${phone}`, isNewUser ? name : undefined);
      if (data.dev_otp) setDevOtp(data.dev_otp); // dev mode hint
      setStep('otp');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send OTP';
      if (msg.toLowerCase().includes('name')) {
        setIsNewUser(true);
        Alert.alert('Welcome!', 'Looks like you\'re new here. Please enter your name.');
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await verifyOTP(`+91${phone}`, otp);
      router.replace('/(app)/home');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        {/* Header */}
        <Text className="text-4xl font-bold text-indigo-600 mb-2">Ghoomo</Text>
        <Text className="text-gray-500 text-base mb-8">
          Campus rides, made simple
        </Text>

        {step === 'phone' ? (
          <>
            {isNewUser && (
              <>
                <Text className="text-gray-700 font-medium mb-1">Your Name</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </>
            )}

            <Text className="text-gray-700 font-medium mb-1">Mobile Number</Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 mb-4">
              <Text className="text-gray-500 text-base mr-2">+91</Text>
              <TextInput
                className="flex-1 py-3 text-base"
                placeholder="9876543210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <TouchableOpacity
              className="bg-indigo-600 rounded-xl py-4 items-center"
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-semibold text-base">Send OTP</Text>}
            </TouchableOpacity>

            {!isNewUser && (
              <TouchableOpacity className="mt-4 items-center" onPress={() => setIsNewUser(true)}>
                <Text className="text-indigo-500 text-sm">New user? Register here</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Text className="text-gray-600 mb-1">
              OTP sent to <Text className="font-semibold">+91 {phone}</Text>
            </Text>
            {!!devOtp && (
              <Text className="text-xs text-orange-500 mb-3">[DEV] OTP: {devOtp}</Text>
            )}

            <Text className="text-gray-700 font-medium mb-1 mt-4">Enter OTP</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-2xl tracking-widest text-center"
              placeholder="------"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              className="bg-indigo-600 rounded-xl py-4 items-center"
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-semibold text-base">Verify OTP</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 items-center"
              onPress={() => { setStep('phone'); setOtp(''); setDevOtp(''); }}
            >
              <Text className="text-indigo-500 text-sm">← Change number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
