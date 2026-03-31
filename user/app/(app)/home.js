/**
 * Home Screen – Map with pickup pin and "Where are you going?" bar
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useRide } from '../../src/context/RideContext';

export default function HomeScreen() {
  const { user, logout }        = useAuth();
  const { currentLocation, setPickup, refreshActiveRide, activeRide, activeRequest } = useRide();
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    refreshActiveRide();
  }, []);

  useEffect(() => {
    if (currentLocation && !region) {
      setRegion({
        latitude:      currentLocation.latitude,
        longitude:     currentLocation.longitude,
        latitudeDelta:  0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [currentLocation]);

  // If there's an active ride/request redirect to appropriate screen
  useEffect(() => {
    if (activeRide) {
      const s = activeRide.status;
      if (s === 'accepted') router.replace('/(app)/driver-assigned');
      if (s === 'started')  router.replace('/(app)/tracking');
    } else if (activeRequest) {
      if (activeRequest.status === 'pending')  router.replace('/(app)/searching');
      if (activeRequest.status === 'matched')  router.replace('/(app)/driver-assigned');
    }
  }, [activeRide, activeRequest]);

  const handleWhereToPress = () => {
    if (!currentLocation) {
      Alert.alert('Location needed', 'Waiting for your GPS location…');
      return;
    }
    setPickup({
      address:   'Current Location',
      latitude:  currentLocation.latitude,
      longitude: currentLocation.longitude,
    });
    router.push('/(app)/pickup-drop');
  };

  return (
    <View className="flex-1">
      <StatusBar barStyle="dark-content" />

      {/* Map */}
      {region ? (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          className="flex-1"
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              title="Your Location"
              pinColor="#6366f1"
            />
          )}
        </MapView>
      ) : (
        <View className="flex-1 items-center justify-center bg-gray-50">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-gray-500 mt-3">Getting your location…</Text>
        </View>
      )}

      {/* Top bar */}
      <View className="absolute top-12 left-4 right-4">
        <View className="bg-white rounded-2xl shadow-lg px-4 py-2 flex-row items-center">
          <Ionicons name="location" size={20} color="#6366f1" />
          <Text className="ml-2 text-gray-400 text-base flex-1">
            {user?.name ? `Hi ${user.name.split(' ')[0]}! ` : ''}
          </Text>
          <TouchableOpacity onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom card */}
      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl px-6 py-6">
        <Text className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Pickup</Text>
        <Text className="text-gray-700 font-medium mb-4" numberOfLines={1}>
          {currentLocation ? 'Current Location' : 'Locating you…'}
        </Text>

        {/* Where to? */}
        <TouchableOpacity
          className="bg-gray-100 rounded-2xl px-4 py-4 flex-row items-center mb-4"
          onPress={handleWhereToPress}
        >
          <Ionicons name="search" size={20} color="#6366f1" />
          <Text className="text-gray-400 text-base ml-3">Where are you going?</Text>
        </TouchableOpacity>

        {/* Quick links */}
        <View className="flex-row gap-3">
          {[
            { label: 'Main Gate',    icon: 'school-outline' },
            { label: 'Bus Stand',    icon: 'bus-outline' },
            { label: 'Railway Stn',  icon: 'train-outline' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              className="flex-1 bg-indigo-50 rounded-xl p-3 items-center"
              onPress={() => router.push({ pathname: '/(app)/pickup-drop', params: { preset: item.label } })}
            >
              <Ionicons name={item.icon} size={20} color="#6366f1" />
              <Text className="text-xs text-indigo-700 mt-1" numberOfLines={1}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Saved / History row */}
        <View className="flex-row justify-between mt-4">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.push('/(app)/saved-locations')}
          >
            <Ionicons name="bookmark-outline" size={16} color="#6366f1" />
            <Text className="ml-1 text-indigo-600 text-sm">Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.push('/(app)/history')}
          >
            <Ionicons name="time-outline" size={16} color="#6366f1" />
            <Text className="ml-1 text-indigo-600 text-sm">History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
