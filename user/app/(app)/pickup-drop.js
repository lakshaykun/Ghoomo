/**
 * Pickup & Drop Selection Screen
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Alert, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRide } from '../../src/context/RideContext';
import { getDefaultLocations } from '../../src/services/api';

const CAMPUS_LOCATIONS = [
  { name: 'IIT Ropar Main Gate',  address: 'IIT Ropar Main Gate, Rupnagar',  latitude: 30.9662, longitude: 76.4704 },
  { name: 'Ropar Bus Stand',      address: 'PRTC Bus Stand, Rupnagar',        latitude: 30.9634, longitude: 76.5271 },
  { name: 'Ropar Railway Station',address: 'Rupnagar Railway Station',         latitude: 30.9627, longitude: 76.5197 },
  { name: 'Sector 70 Mohali',     address: 'Sector 70, SAS Nagar, Mohali',    latitude: 30.7333, longitude: 76.6888 },
];

export default function PickupDropScreen() {
  const { preset } = useLocalSearchParams();
  const { currentLocation, pickup, setPickup, drop, setDrop } = useRide();

  const [activeField, setActiveField] = useState('drop'); // 'pickup' | 'drop'
  const [search, setSearch]           = useState(preset || '');
  const [mapCoords, setMapCoords]     = useState(
    currentLocation || { latitude: 30.9662, longitude: 76.4704 }
  );
  const mapRef = useRef(null);

  const filteredLocations = CAMPUS_LOCATIONS.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectLocation = (loc) => {
    if (activeField === 'pickup') {
      setPickup(loc);
    } else {
      setDrop(loc);
    }
    setSearch('');
    setMapCoords({ latitude: loc.latitude, longitude: loc.longitude });
  };

  const handleMapPress = (e) => {
    const coords = e.nativeEvent.coordinate;
    const loc = {
      address:   `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
      latitude:  coords.latitude,
      longitude: coords.longitude,
    };
    if (activeField === 'pickup') setPickup(loc);
    else setDrop(loc);
    setMapCoords(coords);
  };

  const canProceed = pickup && drop;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-indigo-600">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Choose Pickup & Drop</Text>
      </View>

      {/* Pickup / Drop selector tabs */}
      <View className="flex-row border-b border-gray-200">
        {['pickup','drop'].map((f) => (
          <TouchableOpacity
            key={f}
            className={`flex-1 py-3 items-center ${activeField === f ? 'border-b-2 border-indigo-600' : ''}`}
            onPress={() => setActiveField(f)}
          >
            <Text className={activeField === f ? 'text-indigo-600 font-semibold' : 'text-gray-500'}>
              {f === 'pickup' ? '📍 Pickup' : '🏁 Drop'}
            </Text>
            {(f === 'pickup' ? pickup : drop) && (
              <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
                {(f === 'pickup' ? pickup : drop).name || (f === 'pickup' ? pickup : drop).address}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Search box */}
      <View className="mx-4 mt-3 mb-2 flex-row items-center bg-gray-100 rounded-xl px-3">
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          className="flex-1 ml-2 py-3 text-base"
          placeholder={`Search ${activeField} location…`}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Suggestions */}
      {search.length > 0 && (
        <FlatList
          data={filteredLocations}
          keyExtractor={(item) => item.name}
          className="max-h-48 mx-4 bg-white rounded-xl shadow"
          renderItem={({ item }) => (
            <TouchableOpacity
              className="px-4 py-3 border-b border-gray-100"
              onPress={() => selectLocation(item)}
            >
              <Text className="font-medium text-gray-800">{item.name}</Text>
              <Text className="text-xs text-gray-400">{item.address}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text className="px-4 py-3 text-gray-400 text-sm">No results. Tap map to pin location.</Text>
          }
        />
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        className="flex-1 mx-4 my-2 rounded-2xl"
        region={{ ...mapCoords, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
        onPress={handleMapPress}
        showsUserLocation
      >
        {pickup && (
          <Marker coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
            title="Pickup" pinColor="#22c55e" />
        )}
        {drop && (
          <Marker coordinate={{ latitude: drop.latitude, longitude: drop.longitude }}
            title="Drop" pinColor="#ef4444" />
        )}
      </MapView>

      {/* Bottom CTA */}
      <View className="px-4 py-4 border-t border-gray-100">
        <View className="flex-row mb-3 gap-3">
          <View className="flex-1">
            <Text className="text-xs text-gray-400 uppercase tracking-wider mb-1">Pickup</Text>
            <Text className="text-sm font-medium text-gray-700" numberOfLines={1}>
              {pickup?.name || pickup?.address || 'Not set'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-400 uppercase tracking-wider mb-1">Drop</Text>
            <Text className="text-sm font-medium text-gray-700" numberOfLines={1}>
              {drop?.name || drop?.address || 'Not set'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className={`rounded-2xl py-4 items-center ${canProceed ? 'bg-indigo-600' : 'bg-gray-300'}`}
          disabled={!canProceed}
          onPress={() => router.push('/(app)/request-ride')}
        >
          <Text className={`font-semibold text-base ${canProceed ? 'text-white' : 'text-gray-500'}`}>
            Confirm Locations →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
