import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, ScrollView, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../../hooks';
import { getGroupMessages, sendMessage as sendMsgComp } from '../../services/chatService';

const YELLOW = '#FFD500';

export default function CompanyChat() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { group, company } = route.params;
  const groupData = group || company;
  const title = groupData?.name;
  const groupId = groupData?.id;
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const token = useAppSelector(state => state.auth.token);

  // groupId değişince mesajları temizle ve yeniden yükle (farklı gruba geçişte eski mesajlar görünmesin)
  useEffect(() => {
    setMessages([]);
    fetchMessages();
  }, [groupId]);

  const fetchMessages = async () => {
    if (!token || !groupId) return;
    setLoading(true);
    try {
      const res = await getGroupMessages(token, groupId);
      if (res && res.data && res.data.messages) {
        setMessages(res.data.messages.reverse());
      }
    } catch (error) {
      console.log('Error fetching messages', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!text.trim()) return;

    const content = text.trim();
    setText('');

    // Optimistik update: Hemen listeye ekle (Listenin sonuna ekliyoruz çünkü inverted değil ama sıralama eski->yeni)
    // Bekle, eğer listeyi reverse() ettiysek (Eski -> Yeni), o zaman sona eklemeliyiz.
    // FlatList inverted OLMADIĞI için, en aşağıya scroll etmesi lazım veya biz sona ekleriz.
    // Kullanıcı deneyimi: Mesajlar yukarıdan aşağı akar. En son mesaj en alttadır.
    // Bu durumda array: [Eski, ..., Yeni] olmalı.
    // sendMessage ile sona ekleriz: [...prev, newMessage]

    const tempId = Date.now().toString();
    const newMessage = {
      id: tempId,
      content,
      isOwnMessage: true,
      sentAt: new Date().toISOString()
    };

    setMessages(prev => [newMessage, ...prev]);
    setSending(true);

    try {
      if (!token) throw new Error('Oturum açık değil');
      await sendMsgComp(token, groupId, content);
    } catch (error) {
      Alert.alert('Hata', 'Mesaj gönderilemedi, tekrar deneyiniz.');
      // Hata durumunda geri al
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: any) => {
    const isMyMessage = item.isOwnMessage;
    return (
      <View style={[styles.bubbleContainer, isMyMessage ? styles.myContainer : styles.theirContainer]}>
        {!isMyMessage && item.senderName && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <View style={[styles.bubble, isMyMessage ? styles.myBubble : styles.theirBubble]}>
          <Text style={styles.bubbleText}>{item.content}</Text>
          <Text style={styles.timeText}>
            {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 🔙 HEADER */}
      <View style={[styles.header, { paddingTop: insets.top, height: 52 + insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>

        <TouchableOpacity onPress={() => setDetailVisible(true)} style={styles.detailBtn}>
          <Text style={styles.detailBtnText}>ℹ︎ Detay</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 10 }}
          inverted
          keyboardShouldPersistTaps="handled"
        />

        <View style={[styles.inputRow, { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 12 }]}>
          <TextInput value={text} onChangeText={setText} placeholder="Mesaj yaz..." style={styles.input} />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} disabled={sending}>
            {sending ? <ActivityIndicator size="small" color="#000" /> : <Text style={{ fontWeight: '700' }}>Gönder</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* GRUP DETAY MODAL */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.detailModal}>
          {/* Banner */}
          <View style={styles.detailBanner}>
            <TouchableOpacity style={styles.detailClose} onPress={() => setDetailVisible(false)}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#333' }}>✕</Text>
            </TouchableOpacity>
            <View style={styles.detailAvatar}>
              {groupData?.imageUrl ? (
                <Image source={{ uri: groupData.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 35 }} />
              ) : (
                <Text style={{ fontSize: 30 }}>🏢</Text>
              )}
            </View>
            <Text style={styles.detailGroupName}>{title}</Text>
            <Text style={styles.detailMemberCount}>
              {groupData?.memberCount ? `${groupData.memberCount} üye` : ''}
            </Text>
          </View>

          {/* Detaylar */}
          <ScrollView style={styles.detailBody}>
            {!!groupData?.description && (
              <View style={styles.detailItem}>
                <View style={styles.iconBox}><Text>ℹ︎</Text></View>
                <View style={styles.infoText}>
                  <Text style={styles.detailLabel}>AÇIKLAMA</Text>
                  <Text style={styles.detailValue}>{groupData.description}</Text>
                </View>
              </View>
            )}

            {!!groupData?.provinceName && (
              <View style={styles.detailItem}>
                <View style={styles.iconBox}><Text>📍</Text></View>
                <View style={styles.infoText}>
                  <Text style={styles.detailLabel}>BÖLGE</Text>
                  <Text style={styles.detailValue}>{groupData.provinceName}</Text>
                </View>
              </View>
            )}

            {!!groupData?.ownerName && (
              <View style={styles.detailItem}>
                <View style={styles.iconBox}><Text>👤</Text></View>
                <View style={styles.infoText}>
                  <Text style={styles.detailLabel}>GRUP SAHİBİ</Text>
                  <Text style={styles.detailValue}>{groupData.ownerName}</Text>
                </View>
              </View>
            )}

            {!!groupData?.createdDate && (
              <View style={styles.detailItem}>
                <View style={styles.iconBox}><Text>📅</Text></View>
                <View style={styles.infoText}>
                  <Text style={styles.detailLabel}>OLUŞTURULMA TARİHİ</Text>
                  <Text style={styles.detailValue}>
                    {new Date(groupData.createdDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            )}

            {groupData?.isPublic !== undefined && (
              <View style={styles.detailItem}>
                <View style={styles.iconBox}><Text>{groupData.isPublic ? '🔓' : '🔒'}</Text></View>
                <View style={styles.infoText}>
                  <Text style={styles.detailLabel}>GRUP TÜRÜ</Text>
                  <Text style={styles.detailValue}>{groupData.isPublic ? 'Herkese Açık' : 'Onaylı Katılım'}</Text>
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F4' },
  header: {
    height: 52,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  bubbleContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    marginHorizontal: 12,
  },
  myContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    marginBottom: 2,
  },
  bubble: {
    padding: 10,
    borderRadius: 12,
  },
  myBubble: {
    backgroundColor: YELLOW,
  },
  theirBubble: {
    backgroundColor: '#fff',
  },
  bubbleText: {
    fontSize: 15,
    color: '#000',
  },
  timeText: {
    fontSize: 10,
    color: '#555',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: YELLOW,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    fontWeight: '600',
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  detailBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  /* DETAY MODAL */
  detailModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailBanner: {
    backgroundColor: YELLOW,
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  detailClose: {
    position: 'absolute',
    top: 14,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  detailAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailGroupName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  detailMemberCount: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  detailBody: {
    padding: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconBox: {
    width: 36,
    height: 36,
    minWidth: 36,
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
});
