/**
 * Saved Locations Screen
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getSavedLocations,
  addSavedLocation,
  deleteSavedLocation,
  getDefaultLocations,
} from '../../src/services/api';
import { useRide } from '../../src/context/RideContext';

export default function SavedLocationsScreen() {
  const { setDrop, currentLocation } = useRide();
  const [locations, setLocations]    = useState([]);
  const [defaults, setDefaults]      = useState([]);
  const [loading, setLoading]        = useState(true);
  const [showModal, setShowModal]    = useState(false);
  const [form, setForm]              = useState({ name: '', address: '', latitude: '', longitude: '' });
  const [saving, setSaving]          = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [saved, defs] = await Promise.all([
        getSavedLocations(),
        getDefaultLocations(),
      ]);
      setLocations(saved.data.locations);
      setDefaults(defs.data.locations);
    } catch {}
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, []);

  const handleDelete = (id) => {
    Alert.alert('Remove Location', 'Remove this saved location?', [
      { text: 'Cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteSavedLocation(id);
          setLocations((prev) => prev.filter((l) => l.id !== id));
        },
      },
    ]);
  };

  const handleAdd = async () => {
    if (!form.name || !form.address || !form.latitude || !form.longitude) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      const { data } = await addSavedLocation({
        name:      form.name,
        address:   form.address,
        latitude:  parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      setLocations((prev) => [data.location, ...prev]);
      setShowModal(false);
      setForm({ name: '', address: '', latitude: '', longitude: '' });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  /** Pick this location as drop and go back to pickup-drop */
  const useAsDestination = (loc) => {
    setDrop({ name: loc.name, address: loc.address, latitude: parseFloat(loc.latitude), longitude: parseFloat(loc.longitude) });
    router.push('/(app)/pickup-drop');
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const LocationRow = ({ item, deletable = false }) => (
    <View className="flex-row items-center bg-white border border-gray-100 rounded-2xl px-4 py-3 mb-2 shadow-sm">
      <View className="w-10 h-10 rounded-full bg-indigo-50 items-center justify-center mr-3">
        <Ionicons name="location" size={20} color="#6366f1" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-gray-800 text-sm">{item.name}</Text>
        <Text className="text-gray-400 text-xs" numberOfLines={1}>{item.address}</Text>
      </View>
      <TouchableOpacity
        className="bg-indigo-50 rounded-xl px-3 py-2 mr-1"
        onPress={() => useAsDestination(item)}
      >
        <Text className="text-indigo-600 text-xs font-medium">Go here</Text>
      </TouchableOpacity>
      {deletable && (
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-indigo-600 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Saved Locations</Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}          // placeholder, content below is sections
        renderItem={null}
        ListHeaderComponent={() => (
          <View className="px-4 pt-4">
            {/* Campus Defaults */}
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Campus Quick Access
            </Text>
            {defaults.map((loc) => (
              <LocationRow key={loc.name} item={{ ...loc, latitude: loc.latitude || 0, longitude: loc.longitude || 0 }} />
            ))}

            {/* User Saved */}
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">
              My Saved Places
            </Text>
            {locations.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="bookmark-outline" size={40} color="#d1d5db" />
                <Text className="text-gray-400 mt-2 text-sm">No saved locations yet</Text>
                <TouchableOpacity
                  className="mt-3 bg-indigo-600 rounded-xl px-5 py-2"
                  onPress={() => setShowModal(true)}
                >
                  <Text className="text-white text-sm font-medium">Add a place</Text>
                </TouchableOpacity>
              </View>
            ) : (
              locations.map((loc) => (
                <LocationRow key={loc.id} item={loc} deletable />
              ))
            )}
          </View>
        )}
      />

      {/* Add Location Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <View className="bg-white rounded-t-3xl px-6 pt-5 pb-10 shadow-xl">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-bold text-gray-800">Add Saved Location</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {[
              { key: 'name',      label: 'Name',      placeholder: 'e.g. Home, College, Work' },
              { key: 'address',   label: 'Address',   placeholder: 'Full address or landmark' },
              { key: 'latitude',  label: 'Latitude',  placeholder: 'e.g. 30.9662',  keyboardType: 'decimal-pad' },
              { key: 'longitude', label: 'Longitude', placeholder: 'e.g. 76.4704',  keyboardType: 'decimal-pad' },
            ].map((field) => (
              <View key={field.key} className="mb-3">
                <Text className="text-gray-600 text-sm mb-1">{field.label}</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-base"
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [field.key]: v }))}
                  keyboardType={field.keyboardType || 'default'}
                />
              </View>
            ))}

            {currentLocation && (
              <TouchableOpacity
                className="flex-row items-center mb-4"
                onPress={() => setForm((f) => ({
                  ...f,
                  latitude:  currentLocation.latitude.toString(),
                  longitude: currentLocation.longitude.toString(),
                }))}
              >
                <Ionicons name="locate" size={16} color="#6366f1" />
                <Text className="ml-1 text-indigo-600 text-sm">Use current location coords</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="bg-indigo-600 rounded-2xl py-4 items-center"
              onPress={handleAdd}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-semibold text-base">Save Location</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
