import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, RefreshControl, Image, Linking, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../hooks';
import {
  getListings, getMyListings, getListingById, createListing, updateListing, deleteListing,
  PROVINCES, getProvinceName,
  Listing, CreateListingParams, UpdateListingParams,
} from '../services/listingService';
import { DISTRICTS } from '../constants/districts';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 48) / 2;

const CATEGORIES = [
  { type: 0, label: 'Araç Kiralama',  icon: '🚛', iconBg: '#DBEAFE', sectionTitle: 'ARAÇ KİRALAMA' },
  { type: 1, label: 'Al-Sat',         icon: '🏬', iconBg: '#DCFCE7', sectionTitle: 'SATILIK ARAÇLAR' },
  { type: 2, label: 'Şoför İlanları', icon: '👤', iconBg: '#FFEDD5', sectionTitle: 'İŞ VE ŞOFÖR İLANLARI' },
];

const timeDisplay = (iso: string): string => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} gün önce`;
  return d.toLocaleDateString('tr-TR');
};

const formatPrice = (price?: number): string => {
  if (!price) return '';
  return `${price.toLocaleString('tr-TR')} ₺`;
};

export default function MyAds() {
  const token = useAppSelector(s => s.auth.token);
  const currentUserId = useAppSelector(s => s.auth.user?.id ?? '');

  // Navigation
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const cat = CATEGORIES.find(c => c.type === selectedType);

  // Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  // Data
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);

  // Filters
  const [filterProvince, setFilterProvince] = useState<number | null>(null);
  const [filterProvincePicker, setFilterProvincePicker] = useState(false);
  const [filterProvinceSearch, setFilterProvinceSearch] = useState('');

  // Detail
  const [detailModal, setDetailModal] = useState(false);
  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create form
  const [createModal, setCreateModal] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formProvince, setFormProvince] = useState<number | null>(null);
  const [formDistrict, setFormDistrict] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formProvincePicker, setFormProvincePicker] = useState(false);
  const [formProvinceSearch, setFormProvinceSearch] = useState('');
  const [formDistrictPicker, setFormDistrictPicker] = useState(false);
  const [formDistrictSearch, setFormDistrictSearch] = useState('');

  // Edit form
  const [editModal, setEditModal] = useState(false);
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProvince, setEditProvince] = useState<number | null>(null);
  const [editDistrict, setEditDistrict] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editProvincePicker, setEditProvincePicker] = useState(false);
  const [editProvinceSearch, setEditProvinceSearch] = useState('');
  const [editDistrictPicker, setEditDistrictPicker] = useState(false);
  const [editDistrictSearch, setEditDistrictSearch] = useState('');

  /* ─── Fetch ─── */
  const fetchListings = useCallback(async (reset = false) => {
    if (!token || selectedType === null) return;
    const nextPage = reset ? 1 : pageRef.current + 1;
    if (!reset && !hasMoreRef.current) return;
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      const result = await getListings({
        type: selectedType,
        provinceCode: filterProvince ?? undefined,
        page: nextPage,
        pageSize: 20,
      });
      const items = result.items ?? [];
      setListings(prev => reset ? items : [...prev, ...items]);
      hasMoreRef.current = nextPage < (result.totalPages ?? 1);
      pageRef.current = nextPage;
    } catch {
      Alert.alert('Hata', 'İlanlar yüklenemedi.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token, selectedType, filterProvince]);

  const fetchMyListings = useCallback(async () => {
    if (!token || selectedType === null) return;
    try {
      setLoading(true);
      const data = await getMyListings();
      setMyListings((data ?? []).filter(l => l.listingType === selectedType));
    } catch {
      Alert.alert('Hata', 'İlanlarınız yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [token, selectedType]);

  useEffect(() => {
    if (selectedType === null) return;
    pageRef.current = 1;
    hasMoreRef.current = true;
    setListings([]);
    setMyListings([]);
    if (activeTab === 'all') fetchListings(true);
    else fetchMyListings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, activeTab, filterProvince]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    pageRef.current = 1;
    hasMoreRef.current = true;
    if (activeTab === 'all') await fetchListings(true);
    else await fetchMyListings();
    setRefreshing(false);
  }, [activeTab, fetchListings, fetchMyListings]);

  const onEndReached = () => {
    if (activeTab === 'all' && hasMoreRef.current && !loadingMore) fetchListings(false);
  };

  /* ─── Detail ─── */
  const openDetail = async (item: Listing) => {
    setDetailListing(item);
    setDetailModal(true);
    setDetailLoading(true);
    try {
      const full = await getListingById(item.id);
      setDetailListing(full);
    } catch {}
    finally { setDetailLoading(false); }
  };

  /* ─── Create ─── */
  const openCreate = () => {
    setFormTitle(''); setFormDesc(''); setFormPhone('');
    setFormProvince(null); setFormDistrict(''); setFormPrice('');
    setCreateModal(true);
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) { Alert.alert('Eksik', 'İlan başlığı zorunludur.'); return; }
    if (!formPhone.trim()) { Alert.alert('Eksik', 'İletişim telefonu zorunludur.'); return; }
    if (!formProvince) { Alert.alert('Eksik', 'İl seçimi zorunludur.'); return; }
    if (selectedType === null) return;
    const params: CreateListingParams = {
      listingType: selectedType,
      title: formTitle.trim(),
      description: formDesc.trim() || undefined,
      contactPhone: formPhone.trim(),
      provinceCode: formProvince,
      districtName: formDistrict.trim() || undefined,
      price: selectedType !== 2 && formPrice ? parseFloat(formPrice.replace(',', '.')) || undefined : undefined,
    };
    try {
      setCreateSaving(true);
      await createListing(params);
      setCreateModal(false);
      Alert.alert('Başarılı', 'İlanınız yayınlandı!');
      if (activeTab === 'my') fetchMyListings(); else fetchListings(true);
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.errors?.[0] ?? 'İlan oluşturulamadı.');
    } finally { setCreateSaving(false); }
  };

  /* ─── Edit ─── */
  const openEdit = (item: Listing) => {
    setEditListing(item);
    setEditTitle(item.title);
    setEditDesc(item.description ?? '');
    setEditPhone(item.contactPhone);
    setEditProvince(item.provinceCode);
    setEditDistrict(item.districtName ?? '');
    setEditPrice(item.price ? String(item.price) : '');
    setEditIsActive(item.isActive);
    setDetailModal(false);
    setEditModal(true);
  };

  const handleEdit = async () => {
    if (!editListing) return;
    if (!editTitle.trim()) { Alert.alert('Eksik', 'İlan başlığı zorunludur.'); return; }
    if (!editPhone.trim()) { Alert.alert('Eksik', 'İletişim telefonu zorunludur.'); return; }
    const params: UpdateListingParams = {
      title: editTitle.trim(),
      description: editDesc.trim() || undefined,
      contactPhone: editPhone.trim(),
      provinceCode: editProvince ?? editListing.provinceCode,
      districtName: editDistrict.trim() || undefined,
      price: editListing.listingType !== 2 && editPrice ? parseFloat(editPrice.replace(',', '.')) || undefined : undefined,
      isActive: editIsActive,
    };
    try {
      setEditSaving(true);
      await updateListing(editListing.id, params);
      setEditModal(false);
      Alert.alert('Başarılı', 'İlan güncellendi.');
      if (activeTab === 'my') fetchMyListings(); else fetchListings(true);
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.errors?.[0] ?? 'İlan güncellenemedi.');
    } finally { setEditSaving(false); }
  };

  /* ─── Delete ─── */
  const handleDelete = (id: string) => {
    Alert.alert('İlanı Sil', 'Bu ilanı silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try {
            await deleteListing(id);
            setDetailModal(false);
            Alert.alert('Silindi', 'İlan başarıyla silindi.');
            if (activeTab === 'my') fetchMyListings(); else fetchListings(true);
          } catch { Alert.alert('Hata', 'İlan silinemedi.'); }
        },
      },
    ]);
  };

  /* ─── Toggle active ─── */
  const handleToggleActive = async (item: Listing) => {
    try {
      await updateListing(item.id, { isActive: !item.isActive });
      if (detailListing?.id === item.id) setDetailListing(p => p ? { ...p, isActive: !p.isActive } : null);
      if (activeTab === 'my') fetchMyListings(); else fetchListings(true);
    } catch { Alert.alert('Hata', 'Durum güncellenemedi.'); }
  };

  /* ─── Province picker ─── */
  const filteredProvs = (s: string) => PROVINCES.filter(p => p.name.toLowerCase().includes(s.toLowerCase()));

  const ProvincePicker = ({
    visible, onClose, onSelect, search, setSearch,
  }: {
    visible: boolean; onClose: () => void; onSelect: (c: number) => void;
    search: string; setSearch: (s: string) => void;
  }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.pickerSheet}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerHeaderText}>İl Seçin</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.pickerClose}>✕</Text></TouchableOpacity>
        </View>
        <TextInput style={styles.pickerSearch} placeholder="İl ara..." value={search} onChangeText={setSearch} placeholderTextColor="#aaa" />
        <FlatList
          data={filteredProvs(search)}
          keyExtractor={p => String(p.code)}
          renderItem={({ item: p }) => (
            <TouchableOpacity style={styles.pickerItem} onPress={() => { onSelect(p.code); onClose(); setSearch(''); }}>
              <Text style={styles.pickerItemText}>{p.name}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.pickerSep} />}
        />
      </View>
    </Modal>
  );

  const DistrictPicker = ({
    visible, onClose, onSelect, search, setSearch, provinceCode
  }: {
    visible: boolean; onClose: () => void; onSelect: (d: string) => void;
    search: string; setSearch: (s: string) => void; provinceCode: number | null;
  }) => {
    const districts = provinceCode ? (DISTRICTS[provinceCode] || []) : [];
    const filtered = districts.filter(d => d.label.toLowerCase().includes(search.toLowerCase()));
    
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={onClose} />
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerHeaderText}>İlçe Seçin</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.pickerClose}>✕</Text></TouchableOpacity>
          </View>
          <TextInput style={styles.pickerSearch} placeholder="İlçe ara..." value={search} onChangeText={setSearch} placeholderTextColor="#aaa" />
          <FlatList
            data={filtered}
            keyExtractor={d => d.value}
            renderItem={({ item: d }) => (
              <TouchableOpacity style={styles.pickerItem} onPress={() => { onSelect(d.value); onClose(); setSearch(''); }}>
                <Text style={styles.pickerItemText}>{d.label}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.pickerSep} />}
          />
        </View>
      </Modal>
    );
  };

  /* ─── Form fields ─── */
  const renderFormFields = (mode: 'create' | 'edit') => {
    const type = mode === 'create' ? (selectedType ?? 0) : (editListing?.listingType ?? 0);
    const title    = mode === 'create' ? formTitle    : editTitle;
    const desc     = mode === 'create' ? formDesc     : editDesc;
    const phone    = mode === 'create' ? formPhone    : editPhone;
    const province = mode === 'create' ? formProvince : editProvince;
    const district = mode === 'create' ? formDistrict : editDistrict;
    const price    = mode === 'create' ? formPrice    : editPrice;
    const setTitle    = mode === 'create' ? setFormTitle    : setEditTitle;
    const setDesc     = mode === 'create' ? setFormDesc     : setEditDesc;
    const setPhone    = mode === 'create' ? setFormPhone    : setEditPhone;
    const setDistrict = mode === 'create' ? setFormDistrict : setEditDistrict;
    const setPrice    = mode === 'create' ? setFormPrice    : setEditPrice;
    const openProv = mode === 'create' ? () => setFormProvincePicker(true) : () => setEditProvincePicker(true);
    return (
      <>
        <Text style={styles.formLabel}>Başlık *</Text>
        <TextInput style={styles.formInput} value={title} onChangeText={setTitle} placeholder="İlan başlığı" placeholderTextColor="#aaa" />

        <Text style={styles.formLabel}>Açıklama</Text>
        <TextInput style={[styles.formInput, styles.formTextArea]} value={desc} onChangeText={setDesc} placeholder="Açıklama..." placeholderTextColor="#aaa" multiline numberOfLines={3} textAlignVertical="top" />

        <Text style={styles.formLabel}>İletişim Tel *</Text>
        <TextInput style={styles.formInput} value={phone} onChangeText={setPhone} placeholder="05xx xxx xx xx" placeholderTextColor="#aaa" keyboardType="phone-pad" />

        <Text style={styles.formLabel}>İl *</Text>
        <TouchableOpacity style={styles.formSelect} onPress={openProv}>
          <Text style={[styles.formSelectText, !province && { color: '#aaa' }]}>
            {province ? getProvinceName(province) : 'İl seçin...'}
          </Text>
          <Text style={styles.formSelectArrow}>▼</Text>
        </TouchableOpacity>

        <Text style={styles.formLabel}>İlçe</Text>
        <TouchableOpacity style={styles.formSelect} onPress={() => {
          if (!province) { Alert.alert('Uyarı', 'Lütfen önce il seçiniz.'); return; }
          if (mode === 'create') setFormDistrictPicker(true);
          else setEditDistrictPicker(true);
        }}>
          <Text style={[styles.formSelectText, !district && { color: '#aaa' }]}>
            {district || 'İlçe seçin...'}
          </Text>
          <Text style={styles.formSelectArrow}>▼</Text>
        </TouchableOpacity>

        {type !== 2 && (
          <>
            <Text style={styles.formLabel}>Fiyat (₺)</Text>
            <TextInput style={styles.formInput} value={price} onChangeText={setPrice} placeholder="Fiyat giriniz" placeholderTextColor="#aaa" keyboardType="decimal-pad" />
          </>
        )}

        {mode === 'edit' && (
          <>
            <Text style={styles.formLabel}>Durum</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggleBtn, editIsActive && styles.toggleBtnActive]} onPress={() => setEditIsActive(true)}>
                <Text style={[styles.toggleBtnText, editIsActive && styles.toggleBtnTextActive]}>Aktif</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, !editIsActive && styles.toggleBtnPassive]} onPress={() => setEditIsActive(false)}>
                <Text style={[styles.toggleBtnText, !editIsActive && styles.toggleBtnTextPassive]}>Pasif</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <View style={{ height: 24 }} />
      </>
    );
  };

  /* ─── Card ─── */
  const renderCard = ({ item }: { item: Listing }) => {
    const isOwner = item.userId === currentUserId;
    const locText = [getProvinceName(item.provinceCode), item.districtName].filter(Boolean).join(' (') + (item.districtName ? ')' : '');

    if (item.listingType === 2) {
      return (
        <TouchableOpacity style={styles.cardDriverWrap} onPress={() => openDetail(item)} activeOpacity={0.85}>
          <View style={styles.cardDriverAvatar}><Text style={styles.cardDriverAvatarText}>👤</Text></View>
          <View style={styles.cardDriverBody}>
            <View style={styles.cardDriverRow}>
              {item.userName ? <Text style={styles.cardDriverName}>{item.userName}</Text> : null}
              <Text style={styles.cardDriverTitle}>{item.title}</Text>
            </View>
            {item.description ? <Text style={styles.cardDriverDesc} numberOfLines={2}>{item.description}</Text> : null}
            <View style={styles.cardDriverFooter}>
              <Text style={styles.cardDriverTime}>{timeDisplay(item.createdDate)}</Text>
              <View style={styles.cardActions}>
                {isOwner && !item.isActive && <View style={styles.passiveBadge}><Text style={styles.passiveBadgeText}>Pasif</Text></View>}
                {!isOwner && (
                  <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${item.contactPhone}`)}>
                    <Text style={styles.callBtnText}>📞 Ara</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.cardWrap} onPress={() => openDetail(item)} activeOpacity={0.85}>
        {item.thumbnailUrl
          ? <Image source={{ uri: item.thumbnailUrl }} style={styles.cardImage} />
          : <View style={styles.cardImagePlaceholder}><Text style={styles.cardImageIcon}>{item.listingType === 0 ? '🚛' : '🏬'}</Text></View>
        }
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          {locText ? <Text style={styles.cardLoc} numberOfLines={1}>📍 {locText}</Text> : null}
          {item.userName ? <Text style={styles.cardOwner}>{item.userName}</Text> : null}
          <View style={styles.cardFooter}>
            {item.listingType === 1 && item.price
              ? <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
              : <View />
            }
            <View style={styles.cardActions}>
              {isOwner && !item.isActive && <View style={styles.passiveBadge}><Text style={styles.passiveBadgeText}>Pasif</Text></View>}
              {!isOwner && (
                <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${item.contactPhone}`)}>
                  <Text style={styles.callBtnText}>📞 Ara</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ─── LANDING ─── */
  if (selectedType === null) {
    return (
      <SafeAreaView style={styles.landingContainer} edges={['bottom']}>
        <View style={styles.landingHeader}>
          <Text style={styles.landingIcon}>📢</Text>
          <Text style={styles.landingTitle}>İlanlar</Text>
          <Text style={styles.landingSubtitle}>Kategoriye tıklayarak ilanları görüntüleyin</Text>
        </View>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.type}
              style={styles.categoryCard}
              onPress={() => { setSelectedType(c.type); setActiveTab('all'); setFilterProvince(null); }}
              activeOpacity={0.8}
            >
              <View style={[styles.categoryIconWrap, { backgroundColor: c.iconBg }]}>
                <Text style={styles.categoryEmoji}>{c.icon}</Text>
              </View>
              <Text style={styles.categoryLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  /* ─── LIST VIEW ─── */
  const displayList = activeTab === 'all' ? listings : myListings;

  return (
    <SafeAreaView style={styles.listContainer} edges={['bottom']}>
      {/* Header */}
      <View style={styles.listHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedType(null)}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.listHeaderTitle}>{cat?.sectionTitle}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ İlan Ver</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['all', 'my'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'all' ? 'Tüm İlanlar' : 'İlanlarım'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Province filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.provinceBtn} onPress={() => setFilterProvincePicker(true)}>
          <Text style={styles.provinceBtnText} numberOfLines={1}>
            {filterProvince ? `📍 ${getProvinceName(filterProvince)}` : '🏙 Tüm Şehirler'}
          </Text>
          <Text style={styles.provinceBtnArrow}>▼</Text>
        </TouchableOpacity>
        {filterProvince != null && (
          <TouchableOpacity style={styles.clearFilter} onPress={() => setFilterProvince(null)}>
            <Text style={styles.clearFilterText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading && displayList.length === 0
        ? <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={displayList}
            keyExtractor={i => i.id}
            renderItem={renderCard}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>
                  {activeTab === 'my' ? 'Henüz ilanınız bulunmuyor.' : 'İlan bulunamadı.'}
                </Text>
              </View>
            }
            ListFooterComponent={loadingMore ? <ActivityIndicator color="#000" style={{ margin: 16 }} /> : null}
          />
        )
      }

      {/* Scope Province picker */}
      <ProvincePicker
        visible={filterProvincePicker} onClose={() => setFilterProvincePicker(false)}
        onSelect={c => setFilterProvince(c)} search={filterProvinceSearch} setSearch={setFilterProvinceSearch}
      />

      {/* Create modal */}
      <Modal visible={createModal} transparent animationType="slide" onRequestClose={() => setCreateModal(false)}>
        <ProvincePicker
          visible={formProvincePicker} onClose={() => setFormProvincePicker(false)}
          onSelect={c => { setFormProvince(c); setFormDistrict(''); }} search={formProvinceSearch} setSearch={setFormProvinceSearch}
        />
        <DistrictPicker
          visible={formDistrictPicker} onClose={() => setFormDistrictPicker(false)}
          onSelect={d => setFormDistrict(d)} search={formDistrictSearch} setSearch={setFormDistrictSearch} provinceCode={formProvince}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCreateModal(false)} />
          <View style={styles.formSheet}>
            <View style={styles.formSheetHandle} />
            <View style={styles.formSheetHeader}>
              <View>
                <Text style={styles.formSheetTitle}>İlan Ver</Text>
                <Text style={styles.formSheetSub}>{cat?.label}</Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModal(false)}><Text style={styles.formSheetClose}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
              {renderFormFields('create')}
            </ScrollView>
            <TouchableOpacity style={[styles.formSaveBtn, createSaving && { opacity: 0.6 }]} onPress={handleCreate} disabled={createSaving}>
              {createSaving ? <ActivityIndicator color="#000" /> : <Text style={styles.formSaveBtnText}>Yayınla</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit modal */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <ProvincePicker
          visible={editProvincePicker} onClose={() => setEditProvincePicker(false)}
          onSelect={c => { setEditProvince(c); setEditDistrict(''); }} search={editProvinceSearch} setSearch={setEditProvinceSearch}
        />
        <DistrictPicker
          visible={editDistrictPicker} onClose={() => setEditDistrictPicker(false)}
          onSelect={d => setEditDistrict(d)} search={editDistrictSearch} setSearch={setEditDistrictSearch} provinceCode={editProvince}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditModal(false)} />
          <View style={styles.formSheet}>
            <View style={styles.formSheetHandle} />
            <View style={styles.formSheetHeader}>
              <View>
                <Text style={styles.formSheetTitle}>İlanı Düzenle</Text>
                <Text style={styles.formSheetSub}>{CATEGORIES.find(c => c.type === editListing?.listingType)?.label}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditModal(false)}><Text style={styles.formSheetClose}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
              {renderFormFields('edit')}
            </ScrollView>
            <TouchableOpacity style={[styles.formSaveBtn, editSaving && { opacity: 0.6 }]} onPress={handleEdit} disabled={editSaving}>
              {editSaving ? <ActivityIndicator color="#000" /> : <Text style={styles.formSaveBtnText}>Kaydet</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail modal */}
      {detailListing && (
        <Modal visible={detailModal} transparent animationType="slide" onRequestClose={() => setDetailModal(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDetailModal(false)} />
          <View style={styles.detailSheet}>
            <View style={styles.detailHandle} />
            {detailLoading
              ? <ActivityIndicator size="large" color="#000" style={{ marginVertical: 40 }} />
              : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {detailListing.thumbnailUrl
                    ? <Image source={{ uri: detailListing.thumbnailUrl }} style={styles.detailImage} />
                    : detailListing.listingType !== 2
                      ? <View style={styles.detailImagePlaceholder}><Text style={{ fontSize: 48 }}>{detailListing.listingType === 0 ? '🚛' : '🏬'}</Text></View>
                      : null
                  }
                  <View style={styles.detailContent}>
                    <View style={styles.detailBadgeRow}>
                      <View style={[styles.typeBadge, { backgroundColor: CATEGORIES.find(c => c.type === detailListing.listingType)?.iconBg ?? '#eee' }]}>
                        <Text style={styles.typeBadgeText}>{CATEGORIES.find(c => c.type === detailListing.listingType)?.label}</Text>
                      </View>
                      {!detailListing.isActive && <View style={styles.passiveBadgeLg}><Text style={styles.passiveBadgeLgText}>Pasif</Text></View>}
                    </View>

                    <Text style={styles.detailTitle}>{detailListing.title}</Text>

                    {detailListing.listingType !== 2 && detailListing.price
                      ? <Text style={styles.detailPrice}>{formatPrice(detailListing.price)}</Text>
                      : null
                    }

                    {(detailListing.provinceCode || detailListing.districtName) && (
                      <Text style={styles.detailLoc}>
                        📍 {[getProvinceName(detailListing.provinceCode), detailListing.districtName].filter(Boolean).join(', ')}
                      </Text>
                    )}

                    {detailListing.description
                      ? <Text style={styles.detailDesc}>{detailListing.description}</Text>
                      : null
                    }

                    <View style={styles.detailOwnerBox}>
                      <Text style={styles.detailOwnerName}>{detailListing.userName ?? 'İlan sahibi'}</Text>
                      <Text style={styles.detailOwnerTime}>{timeDisplay(detailListing.createdDate)}</Text>
                    </View>

                    {detailListing.userId !== currentUserId && (
                      <TouchableOpacity style={styles.callBtnLg} onPress={() => Linking.openURL(`tel:${detailListing.contactPhone}`)}>
                        <Text style={styles.callBtnLgText}>📞 Ara</Text>
                      </TouchableOpacity>
                    )}

                    {detailListing.userId === currentUserId && (
                      <View style={styles.ownerActions}>
                        <TouchableOpacity style={styles.ownerEditBtn} onPress={() => openEdit(detailListing)}>
                          <Text style={styles.ownerEditBtnText}>✏️ Düzenle</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.ownerToggleBtn} onPress={() => handleToggleActive(detailListing)}>
                          <Text style={styles.ownerToggleBtnText}>{detailListing.isActive ? '🔴 Pasife Al' : '🟢 Aktife Al'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.ownerDeleteBtn} onPress={() => handleDelete(detailListing.id)}>
                          <Text style={styles.ownerDeleteBtnText}>🗑 Sil</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </ScrollView>
              )
            }
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Landing
  landingContainer:  { flex: 1, backgroundColor: '#FFFBF0' },
  landingHeader:     { alignItems: 'center', paddingTop: 40, paddingBottom: 28, paddingHorizontal: 24 },
  landingIcon:       { fontSize: 40, marginBottom: 8 },
  landingTitle:      { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 8 },
  landingSubtitle:   { fontSize: 14, color: '#666', textAlign: 'center' },
  categoryGrid:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 16 },
  categoryCard:      {
    width: CARD_W, backgroundColor: '#fff', borderRadius: 18,
    alignItems: 'center', paddingVertical: 28, paddingHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  categoryIconWrap:  { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  categoryEmoji:     { fontSize: 32 },
  categoryLabel:     { fontSize: 15, fontWeight: '700', color: '#111', textAlign: 'center' },

  // ── List
  listContainer:     { flex: 1, backgroundColor: '#F5F5F5' },
  listHeader:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', gap: 10 },
  backBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  backBtnText:       { fontSize: 24, color: '#333', lineHeight: 28, fontWeight: '600' },
  listHeaderTitle:   { flex: 1, fontSize: 15, fontWeight: '800', color: '#111' },
  addBtn:            { backgroundColor: '#2E7D32', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText:        { color: '#fff', fontWeight: '700', fontSize: 13 },

  // ── Tabs
  tabRow:            { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab:               { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:         { borderBottomColor: '#FFD500' },
  tabText:           { fontSize: 14, fontWeight: '600', color: '#aaa' },
  tabTextActive:     { color: '#111' },

  // ── Filter
  filterRow:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', gap: 8 },
  provinceBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  provinceBtnText:   { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
  provinceBtnArrow:  { color: '#888', fontSize: 11, marginLeft: 6 },
  clearFilter:       { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  clearFilterText:   { color: '#555', fontSize: 14 },

  listContent:       { padding: 12, paddingBottom: 40 },

  // ── Card type 0/1
  cardWrap:          {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  cardImage:         { width: 110, height: 110, backgroundColor: '#eee' },
  cardImagePlaceholder: { width: 110, height: 110, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  cardImageIcon:     { fontSize: 34 },
  cardBody:          { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTitle:         { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 4 },
  cardLoc:           { fontSize: 12, color: '#E65100', marginBottom: 4 },
  cardOwner:         { fontSize: 12, color: '#888' },
  cardFooter:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardPrice:         { fontSize: 15, fontWeight: '800', color: '#111' },
  cardActions:       { flexDirection: 'row', alignItems: 'center', gap: 6 },

  // ── Card type 2 (driver)
  cardDriverWrap:       {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  cardDriverAvatar:     { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardDriverAvatarText: { fontSize: 22 },
  cardDriverBody:       { flex: 1 },
  cardDriverRow:        { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  cardDriverName:       { fontSize: 14, fontWeight: '700', color: '#111' },
  cardDriverTitle:      { fontSize: 12, fontWeight: '600', color: '#444', backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  cardDriverDesc:       { fontSize: 12, color: '#666', marginBottom: 6, lineHeight: 18 },
  cardDriverFooter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardDriverTime:       { fontSize: 11, color: '#bbb' },

  // ── Call button
  callBtn:           { backgroundColor: '#2E7D32', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  callBtnText:       { color: '#fff', fontSize: 12, fontWeight: '700' },
  callBtnLg:         { backgroundColor: '#2E7D32', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  callBtnLgText:     { color: '#fff', fontSize: 16, fontWeight: '700' },

  // ── Passive badge
  passiveBadge:      { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  passiveBadgeText:  { fontSize: 11, color: '#E65100', fontWeight: '600' },
  passiveBadgeLg:    { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  passiveBadgeLgText:{ fontSize: 12, color: '#E65100', fontWeight: '600' },

  // ── Empty
  emptyWrap:         { alignItems: 'center', paddingTop: 60 },
  emptyIcon:         { fontSize: 48, marginBottom: 16 },
  emptyText:         { fontSize: 15, color: '#888', fontWeight: '500' },

  // ── Province picker
  pickerOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet:       { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  pickerHeader:      { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  pickerHeaderText:  { flex: 1, fontSize: 16, fontWeight: '700', color: '#111' },
  pickerClose:       { fontSize: 18, color: '#777', padding: 4 },
  pickerSearch:      { margin: 12, backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111' },
  pickerItem:        { paddingHorizontal: 16, paddingVertical: 13 },
  pickerItemText:    { fontSize: 15, color: '#222' },
  pickerSep:         { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16 },

  // ── Modal overlay
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },

  // ── Detail sheet
  detailSheet:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  detailHandle:      { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  detailImage:       { width: '100%', height: 200, backgroundColor: '#eee' },
  detailImagePlaceholder: { width: '100%', height: 160, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  detailContent:     { padding: 20 },
  detailBadgeRow:    { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBadge:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText:     { fontSize: 12, fontWeight: '600', color: '#333' },
  detailTitle:       { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 6 },
  detailPrice:       { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 8 },
  detailLoc:         { fontSize: 14, color: '#E65100', marginBottom: 12 },
  detailDesc:        { fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 16 },
  detailOwnerBox:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 6 },
  detailOwnerName:   { fontSize: 14, fontWeight: '600', color: '#333' },
  detailOwnerTime:   { fontSize: 12, color: '#aaa' },
  ownerActions:      { marginTop: 16, gap: 10 },
  ownerEditBtn:      { backgroundColor: '#F5F5F5', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  ownerEditBtnText:  { fontSize: 14, fontWeight: '600', color: '#333' },
  ownerToggleBtn:    { backgroundColor: '#F5F5F5', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  ownerToggleBtnText:{ fontSize: 14, fontWeight: '600', color: '#333' },
  ownerDeleteBtn:    { backgroundColor: '#FFF0F0', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  ownerDeleteBtnText:{ fontSize: 14, fontWeight: '600', color: '#D32F2F' },

  // ── Form sheet
  formSheet:         { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  formSheetHandle:   { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  formSheetHeader:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  formSheetTitle:    { fontSize: 18, fontWeight: '800', color: '#111' },
  formSheetSub:      { fontSize: 13, color: '#888', marginTop: 2 },
  formSheetClose:    { fontSize: 20, color: '#888', padding: 4, marginTop: -4 },
  formScroll:        { paddingHorizontal: 20, paddingTop: 4 },
  formLabel:         { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 16 },
  formInput:         { backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111' },
  formTextArea:      { height: 80, paddingTop: 10 },
  formSelect:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13 },
  formSelectText:    { flex: 1, fontSize: 15, color: '#111' },
  formSelectArrow:   { color: '#888', fontSize: 12 },
  toggleRow:         { flexDirection: 'row', gap: 10 },
  toggleBtn:         { flex: 1, paddingVertical: 11, borderRadius: 8, alignItems: 'center', backgroundColor: '#F5F5F5' },
  toggleBtnActive:   { backgroundColor: '#E8F5E9' },
  toggleBtnPassive:  { backgroundColor: '#FFF3E0' },
  toggleBtnText:     { fontSize: 14, fontWeight: '600', color: '#aaa' },
  toggleBtnTextActive:  { color: '#2E7D32' },
  toggleBtnTextPassive: { color: '#E65100' },
  formSaveBtn:       { margin: 16, backgroundColor: '#FFD500', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  formSaveBtnText:   { fontSize: 16, fontWeight: '800', color: '#000' },
});
