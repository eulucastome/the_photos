import React, { useState } from 'react';
import { View, TextInput, Button, Image, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { insertPhoto } from '../database/repositories/photos.repository';

export default function AddScreen() {
  const [title, setTitle] = useState('');
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return Alert.alert('Permissão', 'Acesso à câmera negado');
    const res = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!res.canceled) setUri(res.assets[0].uri);
  };

  const chooseFromGallery = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return Alert.alert('Permissão', 'Acesso à galeria negado');
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    if (!res.canceled) setUri(res.assets[0].uri);
  };

  const save = async () => {
    if (!title || !uri) return Alert.alert('Aviso', 'Preencha todos os dados');
    setLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = null, lon = null;

      if (status === 'granted') {
        try {
          const loc = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
          if (loc) {
            lat = loc.coords.latitude;
            lon = loc.coords.longitude;
          } else {
            const quickLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
            lat = quickLoc.coords.latitude;
            lon = quickLoc.coords.longitude;
          }
        } catch {
          lat = null;
          lon = null;
        }
      }

      await insertPhoto(title, uri, lat, lon);
      setTitle('');
      setUri(null);
      
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch (err) { 
      Alert.alert('Erro', 'Erro ao salvar no banco'); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20, gap: 10 }}>
      <TextInput placeholder="Título" value={title} onChangeText={setTitle} style={{ borderWidth: 1, padding: 8, borderColor: '#ccc' }} />
      <Button title="📸 Tirar Foto" onPress={takePhoto} />
      <Button title="🖼️ Escolher da Galeria" onPress={chooseFromGallery} color="#5856D6" />
      {uri && <Image source={{ uri }} style={{ width: '100%', height: 200, marginVertical: 10 }} />}
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Salvar" onPress={save} color="green" />
      )}
    </View>
  );
}