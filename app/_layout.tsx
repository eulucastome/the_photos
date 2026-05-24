import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { initDatabase } from '../database/repositories/photos.repository';
import { ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => { initDatabase().then(() => setReady(true)).catch(() => setReady(true)); }, []);
  if (!ready) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Galeria' }} />
      <Tabs.Screen name="add" options={{ title: 'Nova Foto' }} />
      <Tabs.Screen name="map" options={{ title: 'Mapa' }} />
    </Tabs>
  );
}