import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { fetchPhotos, Photo } from '../database/repositories/photos.repository';

export default function MapScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [region, setRegion] = useState<any>(null);
  const [track, setTrack] = useState(true);
  const isFocused = useIsFocused();
  const markerRefs = useRef<{ [key: number]: any }>({});

  useEffect(() => {
    if (!isFocused) return;
    async function load() {
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
      setTimeout(() => setTrack(false), 2000);
    }
    load();
  }, [isFocused]);

  if (!region) return <ActivityIndicator style={{ flex: 1 }} color="#007AFF" />;

  return (
    <MapView style={{ flex: 1 }} provider={PROVIDER_GOOGLE} region={region} onRegionChangeComplete={setRegion}>
      {photos.map((p: any) => (
        <Marker 
          key={p.id} 
          ref={(el) => { markerRefs.current[p.id] = el; }} 
          coordinate={{ latitude: p.latitude, longitude: p.longitude }} 
          title={p.title || 'Sem título'}
          description={p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Sem data'}
          tracksViewChanges={track}
          // O SEGREDO: Reativa o desenho do pino ao tocar, forçando o texto a aparecer na janela
          onPress={() => {
            setTrack(true);
            markerRefs.current[p.id]?.showCallout();
            setTimeout(() => setTrack(false), 500); // Desliga logo em seguida para poupar performance
          }} 
        >
          <View style={styles.pin}>
            <Image source={{ uri: p.image_uri }} style={styles.img} />
            <View style={styles.arrow} />
          </View>
          
          {/* Use o balão padrão para garantir que o Callout apareça corretamente */}
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  pin: { alignItems: 'center', justifyContent: 'center', },
  img: { width: 50, height: 50, borderRadius: 8, borderWidth: 2, borderColor: '#FFF', backgroundColor: '#E5E5EA', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2},
  arrow: { borderTopColor: '#FFF', borderWidth: 5, borderColor: 'transparent', marginTop: -1, elevation: 3 },
});