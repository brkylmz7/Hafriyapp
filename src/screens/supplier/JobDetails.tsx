import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Image, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppSelector } from '../../hooks';
import { getJobHauls } from '../../services/jobSiteNewService';
import { clampRGBA } from 'react-native-reanimated/lib/typescript/Colors';

const YELLOW = '#FFD500';

type Haul = {
    id: string;
    plateNumber: string;
    timeOfHaul: string;
    dumpLocation: string;
    cashAmount: number;
    fuelAmount: number;
    qrCodeBase64?: string;
    isPaid: boolean;
    serialNumber: string;
    tonage?: number;
};

export default function JobDetails() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { job } = route.params || {}; // job passed from MyJobs
    const insets = useSafeAreaInsets();

    const token = useAppSelector(state => state.auth.token);
    const [selectedHaul, setSelectedHaul] = useState<Haul | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [hauls, setHauls] = useState<Haul[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (job?.id && token) {
            fetchHauls();
            console.log("job", job);
        }
    }, [job, token]);

    const fetchHauls = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await getJobHauls(token, job.id);
            setHauls(data);
        } catch (error) {
            console.log('Error fetching hauls:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}.${month}.${year}\n${hours}:${minutes}`;
    };

    const handleOpenModal = (haul: Haul) => {
        setSelectedHaul(haul);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedHaul(null);
    };

    // Header Component
    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>{job?.name || 'Şantiye Adı'}</Text>
                <Text style={styles.headerSubtitle}>{job?.provinceName} • Aktif</Text>
            </View>

            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.stopBtn}>
                    <Text style={styles.stopBtnText}>⏸ Yüklemeyi Durdur</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingsBtn}>
                    <Text style={{ fontSize: 20, textAlign: 'center' as const }}>⚙️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderSummaryCards = () => (
        <View style={styles.cardsRow}>
            {/* Toplam Sefer */}
            <View style={[styles.card, { backgroundColor: '#F5A623' }]}>
                <Text style={styles.cardLabel}>Toplam Sefer</Text>
                <Text style={styles.cardValue}>{hauls.length}</Text>
                <Image source={require('../../../assets/icons/truck.png')} style={[styles.cardIcon, { tintColor: 'white', opacity: 0.5 }]} />
            </View>

            {/* Yakıt Stoğu */}
            <View style={[styles.card, { backgroundColor: '#F5A623' }]}>
                <Text style={styles.cardLabel}>Yakıt Stoğu</Text>
                <Text style={styles.cardValue}>1.000,00 Lt</Text>
                <Image source={require('../../../assets/icons/fuel.png')} style={[styles.cardIcon, { tintColor: 'white', opacity: 0.5 }]} />
            </View>

            {/* Toplam Tonaj */}
            <View style={[styles.card, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.cardLabel}>Toplam Tonaj</Text>
                <Text style={styles.cardValue}>{hauls.reduce((acc, curr) => acc + (curr.tonage || 0), 0)} Ton</Text>
                <Image source={require('../../../assets/icons/layers.png')} style={[styles.cardIcon, { tintColor: 'white', opacity: 0.5 }]} />
            </View>

            {/* Şantiye Durumu */}
            <View style={[styles.card, { backgroundColor: '#2196F3' }]}>
                <Text style={styles.cardLabel}>Şantiye Durumu</Text>
                <Text style={styles.cardValue}>Açık</Text>
                <Image source={require('../../../assets/icons/check_circle.png')} style={[styles.cardIcon, { tintColor: 'white', opacity: 0.5 }]} />
            </View>
        </View>
    );

    const renderHaulItem = ({ item }: { item: Haul }) => (
        <View style={styles.row}>
            <Text style={[styles.cell, { width: 100 }]}>{item.serialNumber || '---'}</Text>
            <Text style={[styles.cell, { width: 90 }]}>{formatDate(item.timeOfHaul)}</Text>
            <View style={{ width: 90, alignItems: 'center', justifyContent: 'center' }}>
                <View style={styles.plateTag}>
                    <Text style={styles.plateText}>{item.plateNumber}</Text>
                </View>
            </View>
            <Text style={[styles.cell, { width: 90, fontWeight: '700' }]}>{item.dumpLocation}</Text>
            <Text style={[styles.cell, { width: 90, color: '#4CAF50', fontWeight: 'bold' }]}>
                {item.cashAmount > 0 ? `${item.cashAmount} TL` : '---'}
            </Text>

            <View style={{ width: 90, alignItems: 'center', justifyContent: 'center' }}>
                <View style={styles.statusTag}>
                    <Text style={styles.statusText}>🕒 Bekliyor</Text>
                </View>
            </View>

            <TouchableOpacity
                style={{ width: 50, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => handleOpenModal(item)}
            >
                <Text style={{ fontSize: 20, textAlign: 'center' as const }}>👁</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {renderHeader()}

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={styles.content}>
                    {renderSummaryCards()}

                    {/* List Header */}
                    <View style={styles.listHeaderContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.listTitle}>📃 Son Seferler</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity style={styles.manualBtn}>
                                <Text style={styles.manualBtnText}>📝 Manuel Ekle</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.addHaulBtn}>
                                <Text style={styles.addHaulBtnText}>＋ Sefer Gir</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.hCell, { width: 100 }]}>SIRA NO</Text>
                        <Text style={[styles.hCell, { width: 90 }]}>TARİH</Text>
                        <Text style={[styles.hCell, { width: 90 }]}>PLAKA</Text>
                        <Text style={[styles.hCell, { width: 90 }]}>ROTA / DÖKÜM</Text>
                        <Text style={[styles.hCell, { width: 90 }]}>ÖDEME</Text>
                        <Text style={[styles.hCell, { width: 90 }]}>DURUM</Text>
                        <Text style={[styles.hCell, { width: 50 }]}>İŞLEM</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={YELLOW} style={{ marginTop: 20 }} />
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View>
                                {hauls.map((item) => (
                                    <View key={item.id}>
                                        {renderHaulItem({ item })}
                                        <View style={styles.divider} />
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    )}
                </View>
            </ScrollView>

            {/* HAUL DETAILS MODAL */}
            {selectedHaul && (
                <Modal
                    visible={modalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={handleCloseModal}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            {/* Modal Header (Yellow) */}
                            <View style={styles.modalHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.modalCompanyName}>BURAK HAFRİYAT</Text>
                                    <Text style={styles.modalCompanySub}>Test Burak1</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                        <Text style={styles.modalDate}>{selectedHaul.timeOfHaul ? new Date(selectedHaul.timeOfHaul).toLocaleDateString() : ''}</Text>
                                        <Text style={styles.modalTime}> | {selectedHaul.timeOfHaul ? new Date(selectedHaul.timeOfHaul).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                                    </View>
                                </View>
                                {selectedHaul.qrCodeBase64 && (
                                    <Image
                                        source={{ uri: `data:image/png;base64,${selectedHaul.qrCodeBase64}` }}
                                        style={styles.qrCode}
                                    />
                                )}
                            </View>

                            {/* Modal Body (Details) */}
                            <View style={styles.modalBody}>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Seri No:</Text>
                                    <Text style={styles.modalValue}>{selectedHaul.serialNumber}</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Plaka:</Text>
                                    <Text style={styles.modalValue}>{selectedHaul.plateNumber}</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Şoför:</Text>
                                    <Text style={styles.modalValue}>+905555550000</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Döküm:</Text>
                                    <Text style={styles.modalValue}>{selectedHaul.dumpLocation}</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Tonaj:</Text>
                                    <Text style={styles.modalValue}>{selectedHaul.tonage ? `${selectedHaul.tonage.toFixed(2)} Ton` : '0,00 Ton'}</Text>
                                </View>

                                <View style={styles.dashedLine} />

                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Ücret:</Text>
                                    <Text style={styles.modalValue}>{selectedHaul.cashAmount ? `${selectedHaul.cashAmount} TL` : '0 TL'} / 60 Lt</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Yetkili:</Text>
                                    <Text style={styles.modalValue}>+905555550000, +905555550001</Text>
                                </View>
                            </View>

                            {/* Modal Actions */}
                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.closeBtn} onPress={handleCloseModal}>
                                    <Text style={styles.closeBtnText}>Kapat</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.printBtn}>
                                    <Text style={styles.printBtnText}>🖨 Yazdır</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFBEA', // Light yellow background like in screenshot
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backBtn: {
        padding: 8,
    },
    backArrow: {
        fontSize: 24,
        color: '#333'
    },
    headerContent: {
        flex: 1,
        marginLeft: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#777',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stopBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF3B30',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    stopBtnText: {
        color: '#FF3B30',
        fontSize: 9,
        fontWeight: '700',
    },
    settingsBtn: {
        padding: 8,
        backgroundColor: '#FFF9C4',
        borderRadius: 8,
    },
    content: {
        padding: 16,
    },
    cardsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    card: {
        width: '48%', // 2 column
        borderRadius: 12,
        padding: 12,
        height: 85, // Reduced height
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    cardLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginBottom: 2,
    },
    cardValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    cardIcon: {
        position: 'absolute',
        right: 8,
        bottom: 8,
        width: 32,
        height: 32,
    },
    listHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#333',
    },
    manualBtn: {
        borderWidth: 1,
        borderColor: '#ccc',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    manualBtnText: {
        color: '#555',
        fontSize: 13,
        fontWeight: '600',
    },
    addHaulBtn: {
        backgroundColor: '#F5A623',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    addHaulBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        backgroundColor: '#f5f5f5',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    hCell: {
        fontSize: 11,
        color: '#777',
        fontWeight: '700',
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#FFF8E1', // Slight yellow tint like screenshot
        borderLeftWidth: 2,
        borderLeftColor: '#F5A623',
        borderRadius: 4,
        marginBottom: 2,
        borderWidth: 1,
        borderBottomColor: 'grey',
        borderTopColor: 'grey',
    },
    cell: {
        fontSize: 13,
        color: '#333',
        textAlign: 'center',
    },
    plateTag: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 14,
        paddingVertical: 2,
        paddingHorizontal: 8,
        alignSelf: 'center',
    },
    plateText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#333',
    },
    statusTag: {
        backgroundColor: '#F5A623',
        borderRadius: 14,
        paddingVertical: 4,
        paddingHorizontal: 10,
        alignSelf: 'center',
    },
    statusText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    divider: {
        height: 6, // Spacing between rows
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fffbe6',
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalHeader: {
        backgroundColor: '#FFD500',
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    modalCompanyName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalCompanySub: {
        fontSize: 14,
        color: '#555',
        marginTop: 2,
    },
    modalDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    modalTime: {
        fontSize: 16,
        fontWeight: '800',
        color: '#333',
    },
    qrCode: {
        width: 80,
        height: 80,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    modalBody: {
        padding: 20,
    },
    modalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    modalLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    modalValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '700',
    },
    dashedLine: {
        height: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderStyle: 'dashed',
        marginVertical: 10,
    },
    modalActions: {
        flexDirection: 'row',
        padding: 20,
        justifyContent: 'space-between',
        gap: 10,
    },
    closeBtn: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#666',
        fontWeight: '700',
        fontSize: 16,
    },
    printBtn: {
        flex: 1,
        backgroundColor: '#F7B500',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    printBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});
