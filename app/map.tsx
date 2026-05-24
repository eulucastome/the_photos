import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';
import { fetchPhotos, Photo } from '../database/repositories/photos.repository';

export default function MapScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [region, setRegion] = useState<any>(null);
  const [track, setTrack] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;

    async function load() {
      // Força o mapa a ficar ativo aceitando re-renderização de imagem
      setTrack(true); 

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setRegion({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      } else {
        setRegion({ latitude: -23.42, longitude: -51.93, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      }
      
      const data = await fetchPhotos();
      setPhotos(data.filter((p: any) => p.latitude && p.longitude));

      // Deixa o mapa livre para desenhar as fotos por 2 segundos e depois trava para economizar memória
      setTimeout(() => setTrack(false), 2000);
    }
    load();
  }, [isFocused]);

  if (!region) return <ActivityIndicator style={{ flex: 1 }} color="#007AFF" />;

  return (
    <MapView style={{ flex: 1 }} provider={PROVIDER_GOOGLE} region={region} onRegionChangeComplete={setRegion}>
      {photos.map((p: any) => (
        <Marker key={p.id} coordinate={{ latitude: p.latitude, longitude: p.longitude }} tracksViewChanges={track}>
          <View style={styles.pin}>
            <Image 
              source={{ uri: p.image_uri }} 
              style={styles.img} 
            />
            <View style={styles.arrow} />
          </View>
          
          <Callout>
            <View style={styles.callout}>
              <Text style={{ fontWeight: '600', fontSize: 13, color: '#333' }} numberOfLines={1}>{p.title}</Text>
              <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
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
  pin: { alignItems: 'center', justifyContent: 'center' },
  img: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: '#FFF', backgroundColor: '#E5E5EA', elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2 },
  arrow: { borderTopColor: '#FFF', borderWidth: 5, borderColor: 'transparent', marginTop: -1, elevation: 3 },
  callout: { width: 130, height: 45, justifyContent: 'center', alignItems: 'center' }
});