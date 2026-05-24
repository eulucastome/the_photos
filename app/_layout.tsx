import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { initDatabase } from '../database/repositories/photos.repository';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => { initDatabase().then(() => setReady(true)); }, []);
  if (!ready) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
      <Tabs.Screen 
        name="index" 
        options={{ title: 'Galeria', tabBarIcon: ({ color, size }) => <FontAwesome name="image" size={size} color={color} /> }} 
      />
      <Tabs.Screen 
        name="add" 
        options={{ title: 'Nova Foto', tabBarIcon: ({ color, size }) => <FontAwesome name="plus-circle" size={size} color={color} /> }} 
      />
      <Tabs.Screen 
        name="map" 
        options={{ title: 'Mapa', tabBarIcon: ({ color, size }) => <FontAwesome name="map" size={size} color={color} /> }} 
      />
    </Tabs>
  );
}