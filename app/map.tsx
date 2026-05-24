import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { fetchPhotos, Photo } from '../database/repositories/photos.repository';

export default function MapScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [track, setTrack] = useState(true);
  const [region, setRegion] = useState<any>(null);

  useEffect(() => {
    async function load() {
      setTrack(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setRegion({ 
          latitude: loc.coords.latitude, 
          longitude: loc.coords.longitude, 
          latitudeDelta: 0.01, 
          longitudeDelta: 0.01 
        });
      } else {
        setRegion({ latitude: -23.42, longitude: -51.93, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      }
      
      const data = await fetchPhotos();
      setPhotos(data.filter((p: any) => p.latitude && p.longitude));
      
      setTimeout(() => setTrack(false), 1500);
    }
    load();
  }, []);

  if (!region) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <MapView 
      style={{ flex: 1 }} 
      provider={PROVIDER_GOOGLE} 
      region={region} 
      onRegionChangeComplete={setRegion}
    >
      {photos.map((p: any) => (
        <Marker key={p.id} coordinate={{ latitude: p.latitude, longitude: p.longitude }} tracksViewChanges={track}>
          {/* O Marcador com a Foto */}
          <View style={styles.marker}>
            <Image source={{ uri: p.image_uri }} style={styles.img} />
          </View>

          {/* Balão que aparece ao tocar na foto */}
          <Callout>
            <View style={styles.callout}>
              <Text style={styles.title}>{p.title}</Text>
              <Text style={styles.date}>
                📅 {p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : ""}
              </Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  marker: { alignItems: 'center' },
  img: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#007AFF', backgroundColor: '#eee' },
  callout: { padding: 5, minWidth: 100, alignItems: 'center' },
  title: { fontWeight: 'bold', fontSize: 12, color: '#333', textAlign: 'center' },
  date: { fontSize: 10, color: '#666', marginTop: 2 }
});