/**
 * Driver Assigned Screen – shows driver card + map
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Linking, Alert, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRide } from '../../src/context/RideContext';
import { onRideStatusUpdate, joinRideRoom } from '../../src/services/socket';

function StarRating({ value }) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(value) ? 'star' : 'star-outline'}
          size={14}
          color="#f59e0b"
        />
      ))}
    </View>
  );
}

export default function DriverAssignedScreen() {
  const { activeRide, activeRequest, pickup, driverLocation, refreshActiveRide } = useRide();
  const mapRef = useRef(null);
  const [eta, setEta] = useState(null);

  const ride    = activeRide;
  const request = activeRequest;
  const driver  = ride || request;

  useEffect(() => {
    refreshActiveRide();
    if (ride?.id) joinRideRoom(ride.id);
  }, []);

  // Socket: redirect when ride starts
  useEffect(() => {
    const off = onRideStatusUpdate(({ status }) => {
      if (status === 'started') router.replace('/(app)/tracking');
      if (status === 'cancelled') {
        Alert.alert('Ride Cancelled', 'The driver cancelled.', [
          { text: 'OK', onPress: () => router.replace('/(app)/home') },
        ]);
      }
    });
    return off;
  }, []);

  // Rough ETA based on distance
  useEffect(() => {
    if (driverLocation && pickup) {
      const dx = (driverLocation.latitude  - pickup.latitude)  * 111;
      const dy = (driverLocation.longitude - pickup.longitude) * 111 * Math.cos(pickup.latitude * Math.PI / 180);
      const km = Math.sqrt(dx * dx + dy * dy);
      setEta(Math.max(1, Math.round(km / 0.3))); // ~18 km/h in city
    }
  }, [driverLocation, pickup]);

  const callDriver = () => {
    const phone = driver?.driver_phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  if (!driver) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const driverCoord = driverLocation || null;
  const pickupCoord = pickup ? { latitude: pickup.latitude, longitude: pickup.longitude } : null;

  return (
    <View className="flex-1 bg-white">
      {/* Map */}
      <View className="flex-1">
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          className="flex-1"
          region={pickupCoord
            ? { ...pickupCoord, latitudeDelta: 0.015, longitudeDelta: 0.015 }
            : { latitude: 30.9662, longitude: 76.4704, latitudeDelta: 0.015, longitudeDelta: 0.015 }}
          showsUserLocation
        >
          {pickupCoord && (
            <Marker coordinate={pickupCoord} title="Your Pickup" pinColor="#22c55e" />
          )}
          {driverCoord && (
            <Marker coordinate={driverCoord} title={driver.driver_name || 'Driver'}>
              <View className="bg-indigo-600 rounded-full p-2">
                <Ionicons name="car" size={20} color="#fff" />
              </View>
            </Marker>
          )}
          {driverCoord && pickupCoord && (
            <Polyline
              coordinates={[driverCoord, pickupCoord]}
              strokeColor="#6366f1"
              strokeWidth={3}
              lineDashPattern={[6, 4]}
            />
          )}
        </MapView>
      </View>

      {/* Driver info card */}
      <View className="bg-white rounded-t-3xl shadow-xl px-6 pt-5 pb-8">
        <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-4" />

        <Text className="text-gray-500 text-sm mb-3">
          {eta ? `Driver arriving in ~${eta} min` : 'Driver on the way to pickup'}
        </Text>

        {/* Driver row */}
        <View className="flex-row items-center mb-4">
          <View className="w-14 h-14 rounded-full bg-indigo-100 items-center justify-center mr-4">
            <Ionicons name="person" size={28} color="#6366f1" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-800 text-base">
              {driver.driver_name || 'Driver'}
            </Text>
            {driver.driver_rating && <StarRating value={parseFloat(driver.driver_rating)} />}
            <Text className="text-gray-500 text-sm mt-0.5">
              {driver.vehicle_number}
              {driver.vehicle_type ? ` · ${driver.vehicle_type}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            className="bg-green-500 rounded-full w-12 h-12 items-center justify-center"
            onPress={callDriver}
          >
            <Ionicons name="call" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Route summary */}
        <View className="bg-gray-50 rounded-2xl p-3 flex-row gap-4">
          <View className="flex-1">
            <Text className="text-xs text-gray-400 mb-0.5">FROM</Text>
            <Text className="text-sm font-medium text-gray-700" numberOfLines={1}>
              {driver.pickup_location || pickup?.address || '—'}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color="#9ca3af" />
          <View className="flex-1">
            <Text className="text-xs text-gray-400 mb-0.5">TO</Text>
            <Text className="text-sm font-medium text-gray-700" numberOfLines={1}>
              {driver.drop_location || '—'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
