import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { deletePhoto, fetchPhotos, Photo, updatePhotoTitle } from '../database/repositories/photos.repository';

const { width } = Dimensions.get('window');
const GAP = 12;
const cardWidth = (width - GAP * 3) / 2;

export default function GalleryScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'date'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const isFocused = useIsFocused();

  const load = () => fetchPhotos().then(data => { setPhotos(data); setLoading(false); });
  useEffect(() => { if (isFocused) load(); }, [isFocused]);

  const formatDataInput = (val: string) => {
    return val.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').substring(0, 10);
  };

  const handleSaveTitle = async () => {
    if (!editId || !editTitle.trim()) return;
    await updatePhotoTitle(editId, editTitle.trim());
    setEditId(null); load();
  };

  const filtered = photos.filter(p => {
    if (filterMode === 'all') return p.title.toLowerCase().includes(search.toLowerCase());
    if (filterMode === 'date' && dateFilter) {
      const parts = dateFilter.split('/');
      const pDate = new Date(p.created_at);
      return parts.length === 3 && pDate.getDate() === +parts[0] && pDate.getMonth() === +parts[1] - 1 && pDate.getFullYear() === +parts[2];
    }
    return true;
  });

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={editId !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Editar título</Text>
          <TextInput value={editTitle} onChangeText={setEditTitle} style={styles.modalInput} />
          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={() => setEditId(null)} style={[styles.actionBtn, { backgroundColor: '#F3F4F6' }]}><Text style={{ color: '#2563EB' }}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSaveTitle} style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}><Text style={{ color: '#FFF' }}>Salvar</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <View style={styles.header}>
        <View><Text style={styles.headerTitle}>Minha galeria</Text></View>
        <View style={styles.badge}><Text style={styles.badgeText}>{filtered.length}</Text></View>
      </View>

      <View style={styles.filterRow}>
        {([['all', 'Tudo'], ['date', 'Filtrar por Data']] as const).map(([mode, label]) => (
          <Pressable key={mode} onPress={() => { setFilterMode(mode); setSearch(''); setDateFilter(''); }} style={[styles.filterBtn, filterMode === mode && styles.filterBtnActive]}><Text style={[styles.filterText, filterMode === mode && { color: '#FFF' }]}>{label}</Text></Pressable>
        ))}
      </View>

      {filterMode === 'date' ? (
        <TextInput placeholder="DD/MM/AAAA" keyboardType="numeric" value={dateFilter} onChangeText={t => setDateFilter(formatDataInput(t))} style={styles.dateInput} />
      ) : (
        <View style={styles.searchContainer}><TextInput placeholder="Buscar por título..." value={search} onChangeText={setSearch} style={styles.searchBar} /></View>
      )}

      <FlatList
        data={filtered} keyExtractor={item => item.id.toString()} numColumns={2} columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingHorizontal: GAP, paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma foto encontrada 📸</Text>}
        renderItem={({ item: p }) => (
          <View style={[styles.card, { width: cardWidth }]}>
            <Image source={{ uri: p.image_uri }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>{p.title}</Text>
              <Text style={styles.cardDate}>📅 {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : ''}</Text>
              
              {p.latitude && p.longitude && (
                <View style={styles.locContainer}>
                  <Text style={styles.locText} numberOfLines={1}>📍 {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</Text>
                </View>
              )}

              <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => { setEditId(p.id); setEditTitle(p.title); }} style={[styles.actionBtn, { backgroundColor: '#E0F2FE' }]}><Ionicons name="pencil" size={12} color="#0369A1" /></TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert("Excluir", "Apagar?", [{ text: "Não" }, { text: "Sim", onPress: async () => { await deletePhoto(p.id); load(); } }])} style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}><Ionicons name="trash" size={12} color="#B91C1C" /></TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16, paddingHorizontal: GAP },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  badge: { backgroundColor: '#2563EB', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, justifyContent: 'center' },
  badgeText: { color: '#FFF', fontWeight: '800' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 10, paddingHorizontal: GAP },
  filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  filterBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { color: '#111827', fontWeight: '700', fontSize: 13 },
  dateInput: { backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, height: 44, marginBottom: 12, fontSize: 15, marginHorizontal: GAP },
  searchContainer: { backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, marginBottom: 12, marginHorizontal: GAP },
  searchBar: { height: 44, fontSize: 15 },
  row: { justifyContent: 'space-between', marginBottom: GAP },
  card: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', elevation: 4 },
  cardImage: { width: '100%', height: 120 },
  cardInfo: { padding: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', height: 36 },
  cardDate: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  locContainer: { backgroundColor: '#F3F4F6', padding: 4, borderRadius: 6, marginBottom: 8 },
  locText: { fontSize: 10, color: '#2563EB', fontWeight: '600' },
  actionsContainer: { flexDirection: 'row', gap: 6 },
  actionBtn: { flex: 1, flexDirection: 'row', paddingVertical: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  modalInput: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 14 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 }
});