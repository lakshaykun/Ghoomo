/**
 * Live Ride Tracking Screen
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRide } from '../../src/context/RideContext';
import { onRideStatusUpdate } from '../../src/services/socket';
import { getGPSLogs } from '../../src/services/api';

const STATUS_LABELS = {
  accepted:  'Driver is heading to pickup',
  started:   'Ride in progress',
  completed: 'Ride completed',
};

export default function TrackingScreen() {
  const { activeRide, driverLocation, currentLocation, refreshActiveRide } = useRide();
  const mapRef      = useRef(null);
  const [route, setRoute] = useState([]);
  const [rideId, setRideId] = useState(activeRide?.id);

  useEffect(() => {
    refreshActiveRide();
  }, []);

  useEffect(() => {
    if (activeRide?.id) setRideId(activeRide.id);
  }, [activeRide]);

  // Load historic GPS breadcrumbs
  useEffect(() => {
    if (rideId) {
      getGPSLogs(rideId)
        .then(({ data }) => setRoute(data.logs))
        .catch(() => {});
    }
  }, [rideId]);

  // Append new driver locations to breadcrumb trail
  useEffect(() => {
    if (driverLocation) {
      setRoute((prev) => [
        ...prev,
        { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
      ]);
    }
  }, [driverLocation]);

  // Listen for ride status via socket
  useEffect(() => {
    const off = onRideStatusUpdate(({ status }) => {
      if (status === 'completed') router.replace('/(app)/ride-completed');
      if (status === 'cancelled') {
        Alert.alert('Ride cancelled', 'The driver cancelled the ride.', [
          { text: 'OK', onPress: () => router.replace('/(app)/home') },
        ]);
      }
    });
    return off;
  }, []);

  const driverCoord = driverLocation
    || (route.length ? route[route.length - 1] : null)
    || { latitude: 30.9662, longitude: 76.4704 };

  const status = activeRide?.status || 'started';

  return (
    <View className="flex-1 bg-white">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        className="flex-1"
        region={{ ...driverCoord, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
        showsUserLocation
      >
        {/* Current user location */}
        {currentLocation && (
          <Marker coordinate={currentLocation} title="You" pinColor="#22c55e" />
        )}

        {/* Driver */}
        <Marker coordinate={driverCoord} title={activeRide?.driver_name || 'Driver'}>
          <View className="bg-indigo-600 rounded-full p-2">
            <Ionicons name="car" size={20} color="#fff" />
          </View>
        </Marker>

        {/* Breadcrumb trail */}
        {route.length >= 2 && (
          <Polyline
            coordinates={route}
            strokeColor="#6366f1"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Status bar overlay */}
      <View className="absolute top-12 left-4 right-4 bg-white rounded-2xl shadow px-4 py-3 flex-row items-center">
        <Ionicons name="navigate" size={20} color="#6366f1" />
        <Text className="ml-3 text-gray-700 font-medium text-sm flex-1">
          {STATUS_LABELS[status] || 'Ride in progress'}
        </Text>
      </View>

      {/* Bottom info */}
      <View className="bg-white px-6 py-4 border-t border-gray-100">
        <View className="flex-row items-center mb-1">
          <Ionicons name="person-circle" size={32} color="#6366f1" />
          <View className="ml-3 flex-1">
            <Text className="font-bold text-gray-800">
              {activeRide?.driver_name || '—'}
            </Text>
            <Text className="text-gray-500 text-xs">
              {activeRide?.vehicle_number} · {activeRide?.vehicle_type}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-gray-400">TO</Text>
            <Text className="text-sm font-medium text-gray-700" numberOfLines={1}>
              {activeRide?.drop_location || '—'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
