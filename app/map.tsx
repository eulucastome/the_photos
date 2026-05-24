import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import { fetchPhotos, Photo } from '../database/repositories/photos.repository';

const { width } = Dimensions.get('window');
const GAP = 12;
const cardWidth = (width - GAP * 3) / 2;

export default function MapScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [region, setRegion] = useState<any>(null);
  const [track, setTrack] = useState(true);
  const isFocused = useIsFocused();
  const markerRefs = useRef<{ [key: number]: any }>({});

  useEffect(() => {
    if (!isFocused) return;
    (async () => {
      setTrack(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      const loc = status === 'granted' ? await Location.getCurrentPositionAsync({}) : null;
      setRegion({
        latitude: loc ? loc.coords.latitude : -23.42,
        longitude: loc ? loc.coords.longitude : -51.93,
        latitudeDelta: 0.01, longitudeDelta: 0.01
      });
      const data = await fetchPhotos();
      setPhotos(data.filter((p: any) => p.latitude && p.longitude));
      setTimeout(() => setTrack(false), 2000);
    })();
  }, [isFocused]);

  const handleMarker = (id: number) => {
    setTrack(true); markerRefs.current[id]?.showCallout(); setTimeout(() => setTrack(false), 800);
  };

  const handleCard = (p: Photo) => {
    if (!p.latitude || !p.longitude) return;
    setRegion({ latitude: p.latitude, longitude: p.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
    setTimeout(() => markerRefs.current[p.id!]?.showCallout(), 600);
  };

  if (!region) return <ActivityIndicator style={styles.loaderCenter} size="large" color="#2563EB" />;

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Mapa</Text>
        <Text style={styles.subtitle}>Toque em um marcador ou foto.</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView style={styles.map} provider={PROVIDER_GOOGLE} region={region} onRegionChangeComplete={setRegion}>
          {photos.map(p => (
            <Marker
              key={p.id!} ref={el => { if(p.id) markerRefs.current[p.id] = el; }}
              coordinate={{ latitude: p.latitude!, longitude: p.longitude! }} title={p.title || 'Sem título'}
              description={p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Sem data'}
              tracksViewChanges={track} onPress={() => handleMarker(p.id!)}
            >
              <View style={styles.pin}><Image source={{ uri: p.image_uri }} style={styles.pinImage} /><View style={styles.arrow} /></View>
            </Marker>
          ))}
        </MapView>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Fotos no mapa</Text>
        {photos.length === 0 ? <Text style={styles.emptyText}>Nenhuma foto encontrada.</Text> : (
          <FlatList
            data={photos} keyExtractor={p => String(p.id)} numColumns={2} columnWrapperStyle={styles.row}
            contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}
            renderItem={({ item: p }) => (
              <TouchableOpacity style={[styles.card, { width: cardWidth }]} onPress={() => handleCard(p)}>
                <Image source={{ uri: p.image_uri }} style={styles.cardImage} />
                <View style={styles.cardInfo}>
                  <Text numberOfLines={1} style={styles.cardTitle}>{p.title || 'Sem título'}</Text>
                  <Text style={styles.cardMeta}>📅 {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Sem data'}</Text>
                  <View style={styles.locContainer}>
                    <Text style={styles.locText} numberOfLines={1}>📍 {p.latitude!.toFixed(4)}, {p.longitude!.toFixed(4)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingHorizontal: GAP, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 2, fontSize: 14, color: '#6B7280' },
  mapContainer: { height: 240, marginHorizontal: GAP, borderRadius: 20, overflow: 'hidden', backgroundColor: '#E5E7EB', elevation: 4 },
  map: { width: '100%', height: '100%' },
  pin: { alignItems: 'center', justifyContent: 'center' },
  pinImage: { width: 44, height: 44, borderRadius: 10, borderWidth: 2, borderColor: '#FFF', backgroundColor: '#E5E7EA' },
  arrow: { borderTopColor: '#FFF', borderWidth: 5, borderColor: 'transparent', marginTop: -1 },
  listSection: { flex: 1, paddingHorizontal: GAP, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  row: { justifyContent: 'space-between', marginBottom: GAP },
  card: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden', elevation: 3 },
  cardImage: { width: '100%', height: 100 },
  cardInfo: { padding: 8 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  cardMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  locContainer: { backgroundColor: '#F3F4F6', padding: 4, borderRadius: 6, marginTop: 6 },
  locText: { fontSize: 10, color: '#2563EB', fontWeight: '600' },
  emptyText: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 18 },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});