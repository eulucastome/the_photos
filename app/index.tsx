import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { fetchPhotos, deletePhoto, Photo } from '../database/repositories/photos.repository';

export default function GalleryScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  
  const load = async () => { 
    try { setPhotos(await fetchPhotos()); } 
    catch { Alert.alert('Erro', 'Erro ao ler DB'); } 
  };
  
  useFocusEffect(useCallback(() => { load(); }, []));

  const del = (id: number) => {
    Alert.alert('Excluir', 'Deseja apagar?', [
      { text: 'Não' }, 
      { text: 'Sim', onPress: async () => { await deletePhoto(id); load(); } }
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <TouchableOpacity style={styles.btn} onPress={() => router.push('/add')}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Nova Foto</Text>
      </TouchableOpacity>
      
      <FlatList 
        data={photos} 
        numColumns={2} 
        keyExtractor={i => i.id.toString()} 
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image_uri }} style={{ width: '100%', height: 100 }} />
            <View style={{ padding: 5 }}>
              <Text style={{ fontWeight: 'bold' }} numberOfLines={1}>{item.title}</Text>
              <Text style={{ fontSize: 10, color: '#666' }}>Data: {item.created_at.split('T')[0]}</Text>
              
              {item.latitude && item.longitude ? (
                <Text style={{ fontSize: 9, color: '#007AFF', marginTop: 2 }}>
                  📍 Lat: {item.latitude.toFixed(4)}{'\n'}Lon: {item.longitude.toFixed(4)}
                </Text>
              ) : (
                <Text style={{ fontSize: 9, color: 'orange', marginTop: 2 }}>
                  ⚠️ Sem GPS
                </Text>
              )}
              
              <TouchableOpacity onPress={() => del(item.id)} style={{ marginTop: 5 }}>
                <Text style={{ color: 'red', fontSize: 12, fontWeight: 'bold' }}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: '#007AFF', padding: 12, margin: 10, alignItems: 'center', borderRadius: 5 },
  card: { width: '45%', margin: '2.5%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 5, overflow: 'hidden' }
});