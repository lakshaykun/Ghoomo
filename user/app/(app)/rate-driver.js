/**
 * Rate Driver Screen
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { rateDriver } from '../../src/services/api';
import { useRide } from '../../src/context/RideContext';

export default function RateDriverScreen() {
  const { ride_id }          = useLocalSearchParams();
  const { clearRide }        = useRide();
  const [rating, setRating]  = useState(0);
  const [review, setReview]  = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Rate the driver', 'Please select a star rating');
      return;
    }
    setLoading(true);
    try {
      await rateDriver(ride_id, rating, review.trim() || undefined);
      Alert.alert('Thank you!', 'Your feedback helps improve the service.', [
        { text: 'Done', onPress: () => { clearRide(); router.replace('/(app)/home'); } },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit rating');
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
        <Text className="text-white text-xl font-bold">Rate Your Driver</Text>
      </View>

      <View className="flex-1 px-6 py-8 items-center">
        <View className="w-20 h-20 rounded-full bg-indigo-100 items-center justify-center mb-4">
          <Ionicons name="person" size={40} color="#6366f1" />
        </View>
        <Text className="text-xl font-bold text-gray-800 mb-1">How was your ride?</Text>
        <Text className="text-gray-400 text-sm mb-8">Your feedback helps drivers improve</Text>

        {/* Stars */}
        <View className="flex-row gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <TouchableOpacity key={i} onPress={() => setRating(i)}>
              <Ionicons
                name={i <= rating ? 'star' : 'star-outline'}
                size={44}
                color={i <= rating ? '#f59e0b' : '#d1d5db'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Rating label */}
        {rating > 0 && (
          <Text className="text-indigo-600 font-medium mb-6 text-base">
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
          </Text>
        )}

        {/* Review text */}
        <TextInput
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-700"
          placeholder="Write a review (optional)…"
          multiline
          numberOfLines={4}
          value={review}
          onChangeText={setReview}
          textAlignVertical="top"
          style={{ height: 100 }}
        />

        <View className="flex-row gap-3 mt-6 w-full">
          <TouchableOpacity
            className="flex-1 border border-gray-200 rounded-2xl py-4 items-center"
            onPress={() => { clearRide(); router.replace('/(app)/home'); }}
          >
            <Text className="text-gray-500 font-medium">Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 rounded-2xl py-4 items-center ${rating ? 'bg-indigo-600' : 'bg-gray-300'}`}
            onPress={handleSubmit}
            disabled={loading || !rating}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className={`font-semibold text-base ${rating ? 'text-white' : 'text-gray-500'}`}>
                  Submit
                </Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
