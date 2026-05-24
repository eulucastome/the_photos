import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { insertPhoto } from '../database/repositories/photos.repository';

export default function AddScreen() {
  const [title, setTitle] = useState('');
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isWide = useWindowDimensions().width >= 700;

  const pickImage = async (type: 'camera' | 'library') => {
    const isCam = type === 'camera';
    const { granted } = isCam ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return Alert.alert('Permissão', 'Acesso negado');
    
    const res = isCam 
      ? await ImagePicker.launchCameraAsync({ quality: 0.5 }) 
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    if (!res.canceled) setUri(res.assets[0].uri);
  };

  const save = async () => {
    if (!title.trim() || !uri) return Alert.alert('Aviso', 'Preencha todos os dados');
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = null, lon = null;
      if (status === 'granted') {
        const loc = await Location.getLastKnownPositionAsync({ maxAge: 60000 }) || await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
        lat = loc.coords.latitude; lon = loc.coords.longitude;
      }
      await insertPhoto(title.trim(), uri, lat, lon);
      setTitle(''); setUri(null);
      if (router.canGoBack()) router.back(); else router.replace('/');
    } catch {
      Alert.alert('Erro', 'Erro ao salvar no banco');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Nova Foto</Text>
            <Text style={styles.subtitle}>Salve sua foto com localização.</Text>
          </View>

          <View style={styles.card}>
            <TextInput placeholder="Título" value={title} onChangeText={setTitle} style={styles.input} />

            <View style={[styles.btnRow, isWide && { flexDirection: 'row' }]}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#2563EB' }]} onPress={() => pickImage('camera')}><Text style={styles.btnText}>📸 Câmera</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#E0F2FE' }]} onPress={() => pickImage('library')}><Text style={[styles.btnText, { color: '#2563EB' }]}>🖼️ Galeria</Text></TouchableOpacity>
            </View>

            <View style={styles.previewContainer}>
              {uri ? <Image source={{ uri }} style={[styles.preview, isWide && { height: 320 }]} /> : <Text style={{ color: '#6B7280' }}>Sua foto aparecerá aqui</Text>}
            </View>

            {loading ? <ActivityIndicator style={{ marginTop: 20 }} size="large" /> : (
              <TouchableOpacity style={styles.saveBtn} onPress={save}><Text style={styles.saveBtnText}>Salvar</Text></TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 4 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 8 },
  input: { backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, marginBottom: 16 },
  btnRow: { flexDirection: 'column', gap: 12 },
  btn: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  previewContainer: { marginTop: 18, borderRadius: 20, overflow: 'hidden', backgroundColor: '#E5E7EB', minHeight: 220, justifyContent: 'center', alignItems: 'center' },
  preview: { width: '100%', height: 220 },
  saveBtn: { marginTop: 20, borderRadius: 16, backgroundColor: '#16A34A', paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 }
});