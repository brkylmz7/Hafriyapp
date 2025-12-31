import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

const YELLOW = '#FFD500';

const initialMessages = [
  { id: '1', text: 'Yükleme başladı', mine: false },
  { id: '2', text: 'Tamamdır, haber bekliyorum', mine: true },
];

export default function CompanyChat() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { company } = route.params;

  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState('');

  const sendMessage = () => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { id: Date.now().toString(), text, mine: true }]);
    setText('');
  };

  const renderItem = ({ item }: any) => (
    <View style={[styles.bubble, item.mine ? styles.myBubble : styles.theirBubble]}>
      <Text style={styles.bubbleText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 🔙 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {company.name}
        </Text>

        {/* sağ taraf boş kalsın diye */}
        <View style={{ width: 32 }} />
      </View>

      <FlatList data={messages} keyExtractor={item => item.id} renderItem={renderItem} contentContainerStyle={{ paddingVertical: 10 }} />

      <View style={styles.inputRow}>
        <TextInput value={text} onChangeText={setText} placeholder="Mesaj yaz..." style={styles.input} />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={{ fontWeight: '700' }}>Gönder</Text>
        </TouchableOpacity>
      </View>
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
  bubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 12,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: YELLOW,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  bubbleText: {
    fontSize: 13,
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
