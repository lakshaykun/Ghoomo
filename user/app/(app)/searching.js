/**
 * Searching for Driver Screen
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRide } from '../../src/context/RideContext';
import { onRideAccepted } from '../../src/services/socket';

export default function SearchingScreen() {
  const { activeRequest, cancelRequest, refreshActiveRide } = useRide();
  const pulse = useRef(new Animated.Value(1)).current;
  const [cancelling, setCancelling] = useState(false);

  // Pulse animation
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 800, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 800, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  // Poll for driver assignment every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await refreshActiveRide();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen for socket ride_accepted
  useEffect(() => {
    const off = onRideAccepted(async () => {
      await refreshActiveRide();
      router.replace('/(app)/driver-assigned');
    });
    return off;
  }, []);

  const handleCancel = async () => {
    Alert.alert('Cancel Ride?', 'Are you sure you want to cancel?', [
      { text: 'No' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            if (activeRequest?.id) await cancelRequest(activeRequest.id);
            router.replace('/(app)/home');
          } catch {
            Alert.alert('Error', 'Could not cancel. Try again.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      {/* Pulsing icon */}
      <Animated.View
        style={{ transform: [{ scale: pulse }] }}
        className="w-28 h-28 rounded-full bg-indigo-100 items-center justify-center mb-6"
      >
        <Ionicons name="car-sport" size={56} color="#6366f1" />
      </Animated.View>

      <Text className="text-2xl font-bold text-gray-800 mb-2">Finding your driver…</Text>
      <Text className="text-gray-400 text-center mb-2">
        Searching for auto-rickshaws near your pickup point
      </Text>

      {activeRequest && (
        <View className="bg-gray-50 rounded-2xl p-4 w-full mb-6 mt-4">
          <View className="flex-row items-center mb-3">
            <View className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <Text className="text-gray-600 text-sm flex-1" numberOfLines={1}>
              {activeRequest.pickup_location || 'Pickup location'}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-red-500 mr-3" />
            <Text className="text-gray-600 text-sm flex-1" numberOfLines={1}>
              {activeRequest.drop_location || 'Drop location'}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        className="border-2 border-red-400 rounded-2xl py-3 px-8"
        onPress={handleCancel}
        disabled={cancelling}
      >
        <Text className="text-red-400 font-semibold">
          {cancelling ? 'Cancelling…' : 'Cancel Request'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
