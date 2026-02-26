import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../hooks';
import { getGroupMessages, sendMessage as sendMsgComp } from '../../services/chatService';

const YELLOW = '#FFD500';

export default function CompanyChat() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { group, company } = route.params;
  const title = group?.name || company?.name;
  const groupId = group?.id || company?.id;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const token = useAppSelector(state => state.auth.token);

  useEffect(() => {
    fetchMessages();
  }, []);

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>

        {/* sağ taraf boş kalsın diye */}
        <View style={{ width: 32 }} />
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

        <View style={styles.inputRow}>
          <TextInput value={text} onChangeText={setText} placeholder="Mesaj yaz..." style={styles.input} />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} disabled={sending}>
            {sending ? <ActivityIndicator size="small" color="#000" /> : <Text style={{ fontWeight: '700' }}>Gönder</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    fontSize: 13,
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
    fontSize: 14,
  },
});
