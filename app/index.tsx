import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { deletePhoto, fetchPhotos, Photo, updatePhotoTitle } from '../database/repositories/photos.repository';

export default function GalleryScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'nearby' | 'date'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState(5);
  const [locationStatus, setLocationStatus] = useState('');
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const columnCount = width >= 900 ? 3 : width >= 600 ? 2 : 1;
  const cardMargin = 10;
  const cardWidth = (width - 30 - cardMargin * (columnCount - 1)) / columnCount;

  const loadPhotos = () => {
    fetchPhotos().then((data) => {
      setPhotos(data);
      setLoading(false);
    });
  };

  const getCurrentLocation = async () => {
    setLocationStatus('Buscando localização...');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationStatus('Permissão negada');
      Alert.alert('Localização', 'Permissão de localização negada.');
      return null;
    }

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setCurrentLocation(coords);
    setLocationStatus('Localização obtida');
    return coords;
  };

  const openEditTitleModal = (id: number, currentTitle: string) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
    setModalVisible(true);
  };

  const saveEditedTitle = async () => {
    if (editingId === null || editingTitle.trim() === '') return;

    try {
      await updatePhotoTitle(editingId, editingTitle.trim());
      setModalVisible(false);
      setEditingId(null);
      setEditingTitle('');
      loadPhotos();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível atualizar o título.');
    }
  };

  const parseDate = (value: string) => {
    const parts = value.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const parsed = new Date(year, month, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filterByProximity = async () => {
    const coords = currentLocation || await getCurrentLocation();
    if (!coords) return;
    setFilterMode('nearby');
  };

  const filterByDate = () => {
    setFilterMode('date');
  };

  const clearFilters = () => {
    setFilterMode('all');
    setDateFilter('');
    setLocationStatus('');
  };

  useEffect(() => {
    if (isFocused) loadPhotos();
  }, [isFocused]);

  const handleDeletePhoto = (id: number) => {
    Alert.alert(
      "Excluir Foto",
      "Tem certeza que deseja apagar esta foto permanentemente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePhoto(id);
              loadPhotos();
            } catch (err) {
              Alert.alert("Erro", "Não foi possível excluir a foto.");
            }
          }
        }
      ]
    );
  };

  const filteredPhotos = photos
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => {
      if (filterMode === 'nearby') {
        if (!currentLocation || !p.latitude || !p.longitude) return false;
        return getDistanceKm(currentLocation.latitude, currentLocation.longitude, p.latitude, p.longitude) <= distanceKm;
      }
      if (filterMode === 'date') {
        const parsed = parseDate(dateFilter);
        if (!parsed) return true;
        const photoDate = new Date(p.created_at);
        return (
          photoDate.getDate() === parsed.getDate() &&
          photoDate.getMonth() === parsed.getMonth() &&
          photoDate.getFullYear() === parsed.getFullYear()
        );
      }
      return true;
    });

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#007AFF" />;

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar título</Text>
            <TextInput
              value={editingTitle}
              onChangeText={setEditingTitle}
              placeholder="Novo título"
              placeholderTextColor="#A1A1AA"
              style={styles.modalInput}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setEditingId(null);
                  setEditingTitle('');
                }}
                style={[styles.actionButton, { backgroundColor: '#F3F4F6' }]}
              >
                <Text style={[styles.actionText, { color: '#2563EB' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEditedTitle}
                style={[styles.actionButton, { backgroundColor: '#2563EB' }]}
              >
                <Text style={[styles.actionText, { color: '#FFF' }]}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Minha galeria</Text>
          <Text style={styles.headerSubtitle}>Filtre por proximidade, data ou busque pelo título.</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{filteredPhotos.length}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <Pressable
          onPress={clearFilters}
          style={({ pressed }) => [styles.filterButton, filterMode === 'all' && styles.filterButtonActive, pressed && styles.filterPressed]}
        >
          <Text style={[styles.filterText, filterMode === 'all' && styles.filterTextActive]}>Tudo</Text>
        </Pressable>
        <Pressable
          onPress={filterByProximity}
          style={({ pressed }) => [styles.filterButton, filterMode === 'nearby' && styles.filterButtonActive, pressed && styles.filterPressed]}
        >
          <Text style={[styles.filterText, filterMode === 'nearby' && styles.filterTextActive]}>Próximo</Text>
        </Pressable>
        <Pressable
          onPress={filterByDate}
          style={({ pressed }) => [styles.filterButton, filterMode === 'date' && styles.filterButtonActive, pressed && styles.filterPressed]}
        >
          <Text style={[styles.filterText, filterMode === 'date' && styles.filterTextActive]}>Data</Text>
        </Pressable>
      </View>

      {filterMode === 'date' && (
        <TextInput
          placeholder="Digite a data (DD/MM/AAAA)"
          placeholderTextColor="#8E8E93"
          value={dateFilter}
          onChangeText={setDateFilter}
          style={styles.dateInput}
        />
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar título ou endereço"
          placeholderTextColor="#8E8E93"
          value={search}
          onChangeText={setSearch}
          style={styles.searchBar}
        />
      </View>

      {filterMode === 'nearby' && currentLocation && (
        <Text style={styles.filterInfo}>Mostrando fotos até {distanceKm} km de você</Text>
      )}
      {filterMode === 'date' && dateFilter !== '' && (
        <Text style={styles.filterInfo}>Mostrando fotos da data {dateFilter}</Text>
      )}

      <FlatList
        data={filteredPhotos}
        keyExtractor={(item) => item.id.toString()}
        numColumns={columnCount}
        columnWrapperStyle={columnCount > 1 ? styles.row : undefined}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma foto encontrada 📸</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { width: cardWidth }]}> 
            <Image source={{ uri: item.image_uri }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardDate}>📅 {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : ''}</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  onPress={() => openEditTitleModal(item.id, item.title)}
                  style={[styles.actionButton, { backgroundColor: '#E0F2FE' }]}
                >
                  <Ionicons name="pencil" size={13} color="#0369A1" />
                  <Text style={[styles.actionText, { color: '#0369A1' }]}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeletePhoto(item.id)}
                  style={[styles.actionButton, { backgroundColor: '#FEE2E2' }]}
                >
                  <Ionicons name="trash" size={13} color="#B91C1C" />
                  <Text style={[styles.actionText, { color: '#B91C1C' }]}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', paddingHorizontal: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#6B7280', lineHeight: 20, maxWidth: '72%' },
  badge: { backgroundColor: '#2563EB', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, minWidth: 44, alignItems: 'center' },
  badgeText: { color: '#FFF', fontWeight: '800' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  filterButton: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  filterButtonActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterPressed: { opacity: 0.8 },
  filterText: { color: '#111827', fontWeight: '700', fontSize: 13 },
  filterTextActive: { color: '#FFFFFF' },
  dateInput: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12, color: '#111827' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { marginRight: 10 },
  searchBar: { flex: 1, height: 48, fontSize: 15, color: '#111827' },
  filterInfo: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  listContent: { paddingBottom: 24 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 22, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  cardImage: { width: '100%', height: 150, backgroundColor: '#E5E7EB' },
  cardInfo: { padding: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827', lineHeight: 22, marginBottom: 8 },
  cardDate: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 14, gap: 8 },
  actionText: { fontSize: 12, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, elevation: 14, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
  modalInput: { backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 18, color: '#111827' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});