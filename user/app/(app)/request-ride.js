/**
 * Request Ride Screen – Confirm ride details before booking
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRide } from '../../src/context/RideContext';
import { getNearbyDrivers } from '../../src/services/api';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R  = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
}

export default function RequestRideScreen() {
  const { pickup, drop, requestRide } = useRide();
  const [nearbyCount, setNearbyCount] = useState(null);
  const [loading, setLoading]         = useState(false);

  const distance = pickup && drop
    ? haversineKm(pickup.latitude, pickup.longitude, drop.latitude, drop.longitude)
    : 0;

  // Estimated fare: ₹15 base + ₹10/km
  const estimatedFare = Math.round(15 + distance * 10);

  useEffect(() => {
    if (pickup) {
      getNearbyDrivers(pickup.latitude, pickup.longitude)
        .then(({ data }) => setNearbyCount(data.drivers.length))
        .catch(() => setNearbyCount(0));
    }
  }, [pickup]);

  if (!pickup || !drop) {
    router.replace('/(app)/pickup-drop');
    return null;
  }

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await requestRide(pickup, drop);
      router.replace('/(app)/searching');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to request ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-indigo-600">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Confirm Ride</Text>
      </View>

      <View className="flex-1 px-6 py-6">
        {/* Route card */}
        <View className="bg-gray-50 rounded-2xl p-4 mb-5">
          <View className="flex-row items-start mb-4">
            <View className="items-center mr-3">
              <View className="w-3 h-3 rounded-full bg-green-500" />
              <View className="w-0.5 h-8 bg-gray-300 my-1" />
              <View className="w-3 h-3 rounded-full bg-red-500" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-400 mb-0.5">PICKUP</Text>
              <Text className="font-medium text-gray-800 text-sm mb-3" numberOfLines={2}>
                {pickup.name || pickup.address}
              </Text>
              <Text className="text-xs text-gray-400 mb-0.5">DROP</Text>
              <Text className="font-medium text-gray-800 text-sm" numberOfLines={2}>
                {drop.name || drop.address}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-indigo-50 rounded-2xl p-4 items-center">
            <Ionicons name="navigate-outline" size={24} color="#6366f1" />
            <Text className="text-indigo-700 font-bold text-lg mt-1">{distance} km</Text>
            <Text className="text-indigo-400 text-xs">Distance</Text>
          </View>
          <View className="flex-1 bg-green-50 rounded-2xl p-4 items-center">
            <Ionicons name="cash-outline" size={24} color="#22c55e" />
            <Text className="text-green-700 font-bold text-lg mt-1">~₹{estimatedFare}</Text>
            <Text className="text-green-400 text-xs">Est. Fare</Text>
          </View>
          <View className="flex-1 bg-orange-50 rounded-2xl p-4 items-center">
            <Ionicons name="car-outline" size={24} color="#f97316" />
            <Text className="text-orange-700 font-bold text-lg mt-1">
              {nearbyCount === null ? '…' : nearbyCount}
            </Text>
            <Text className="text-orange-400 text-xs">Drivers</Text>
          </View>
        </View>

        <Text className="text-gray-400 text-xs text-center mb-6">
          Final fare is set by the driver on accepting your request
        </Text>

        {nearbyCount === 0 && (
          <View className="bg-yellow-50 rounded-xl p-3 mb-4 flex-row items-center">
            <Ionicons name="warning-outline" size={18} color="#f59e0b" />
            <Text className="ml-2 text-yellow-700 text-sm flex-1">
              No drivers nearby right now. Your request will wait in queue.
            </Text>
          </View>
        )}
      </View>

      {/* CTA */}
      <View className="px-6 pb-8">
        <TouchableOpacity
          className="bg-indigo-600 rounded-2xl py-5 items-center"
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text className="text-white font-bold text-base">Confirm Ride →</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}
