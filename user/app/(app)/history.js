/**
 * Ride History Screen
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRideHistory } from '../../src/services/api';

const STATUS_COLORS = {
  completed:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Completed'  },
  cancelled:  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Cancelled'  },
  started:    { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'In Progress'},
  accepted:   { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Accepted'   },
};

function RideCard({ ride }) {
  const sc  = STATUS_COLORS[ride.status] || STATUS_COLORS.completed;
  const date = new Date(ride.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <View className="bg-white border border-gray-100 rounded-2xl p-4 mb-3 shadow-sm">
      {/* Top row */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-xs text-gray-400 mb-0.5">{date}</Text>
          <Text className="font-semibold text-gray-800">{ride.driver_name || 'Driver'}</Text>
          <Text className="text-xs text-gray-400">{ride.vehicle_number}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${sc.bg}`}>
          <Text className={`text-xs font-semibold ${sc.text}`}>{sc.label}</Text>
        </View>
      </View>

      {/* Route */}
      <View className="flex-row items-center mb-3">
        <View className="items-center mr-2">
          <View className="w-2 h-2 rounded-full bg-green-500" />
          <View className="w-0.5 h-4 bg-gray-200 my-0.5" />
          <View className="w-2 h-2 rounded-full bg-red-500" />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-600 mb-2" numberOfLines={1}>{ride.pickup_location}</Text>
          <Text className="text-xs text-gray-600" numberOfLines={1}>{ride.drop_location}</Text>
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row gap-4 pt-3 border-t border-gray-100">
        {ride.fare && (
          <View className="flex-row items-center">
            <Ionicons name="cash-outline" size={14} color="#9ca3af" />
            <Text className="text-xs text-gray-500 ml-1">₹{ride.fare}</Text>
          </View>
        )}
        {ride.distance && (
          <View className="flex-row items-center">
            <Ionicons name="navigate-outline" size={14} color="#9ca3af" />
            <Text className="text-xs text-gray-500 ml-1">{ride.distance} km</Text>
          </View>
        )}
        {ride.rating && (
          <View className="flex-row items-center">
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text className="text-xs text-gray-500 ml-1">{ride.rating}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const [rides, setRides]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset]     = useState(0);
  const [hasMore, setHasMore]   = useState(true);
  const LIMIT = 20;

  const loadRides = useCallback(async (reset = false) => {
    const off = reset ? 0 : offset;
    try {
      const { data } = await getRideHistory(LIMIT, off);
      const newRides = data.rides;
      setRides((prev) => reset ? newRides : [...prev, ...newRides]);
      setOffset(off + newRides.length);
      setHasMore(newRides.length === LIMIT);
    } catch {}
  }, [offset]);

  useEffect(() => { loadRides(true).finally(() => setLoading(false)); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRides(true);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-indigo-600 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Ride History</Text>
      </View>

      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <RideCard ride={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={() => { if (hasMore) loadRides(); }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Ionicons name="car-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400 mt-3">No rides yet</Text>
          </View>
        }
        ListFooterComponent={
          hasMore && rides.length > 0
            ? <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 16 }} />
            : null
        }
      />
    </View>
  );
}
