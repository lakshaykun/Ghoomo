/**
 * Ride Completed Screen
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRide } from '../../src/context/RideContext';
import { getRide } from '../../src/services/api';

export default function RideCompletedScreen() {
  const { activeRide, clearRide } = useRide();
  const [ride, setRide]           = useState(activeRide);
  const [loading, setLoading]     = useState(!activeRide);

  useEffect(() => {
    if (activeRide?.id && !activeRide.fare) {
      setLoading(true);
      getRide(activeRide.id)
        .then(({ data }) => setRide(data.ride))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activeRide]);

  const handleRateDriver = () => {
    if (ride) {
      router.push({ pathname: '/(app)/rate-driver', params: { ride_id: ride.id } });
    }
  };

  const handleGoHome = () => {
    clearRide();
    router.replace('/(app)/home');
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Success hero */}
      <View className="bg-indigo-600 items-center justify-center py-16 px-6">
        <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4">
          <Ionicons name="checkmark-circle" size={56} color="#fff" />
        </View>
        <Text className="text-white text-2xl font-bold">Ride Completed!</Text>
        <Text className="text-indigo-200 text-sm mt-1">Thanks for riding with Ghoomo</Text>
      </View>

      {/* Ride summary */}
      <View className="flex-1 px-6 py-6">
        {/* Fare card */}
        <View className="bg-gray-50 rounded-2xl p-5 mb-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-500">Fare Paid</Text>
            <Text className="text-2xl font-bold text-gray-800">
              {ride?.fare ? `₹${ride.fare}` : 'Set by driver'}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400 text-sm">Distance</Text>
            <Text className="text-gray-700 text-sm font-medium">
              {ride?.distance ? `${ride.distance} km` : '—'}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400 text-sm">Driver</Text>
            <Text className="text-gray-700 text-sm font-medium">
              {ride?.driver_name || '—'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm">Vehicle</Text>
            <Text className="text-gray-700 text-sm font-medium">
              {ride?.vehicle_number || '—'}
            </Text>
          </View>
        </View>

        {/* Route */}
        <View className="flex-row items-center bg-gray-50 rounded-2xl p-4 mb-6">
          <View className="items-center mr-3">
            <View className="w-3 h-3 rounded-full bg-green-500" />
            <View className="w-0.5 h-6 bg-gray-300 my-1" />
            <View className="w-3 h-3 rounded-full bg-red-500" />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-gray-600 mb-3" numberOfLines={1}>
              {ride?.pickup_location || '—'}
            </Text>
            <Text className="text-sm text-gray-600" numberOfLines={1}>
              {ride?.drop_location || '—'}
            </Text>
          </View>
        </View>

        {/* CTA buttons */}
        <TouchableOpacity
          className="bg-indigo-600 rounded-2xl py-4 items-center mb-3"
          onPress={handleRateDriver}
        >
          <Text className="text-white font-semibold text-base">⭐  Rate Your Driver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-gray-200 rounded-2xl py-4 items-center"
          onPress={handleGoHome}
        >
          <Text className="text-gray-600 font-medium">Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
