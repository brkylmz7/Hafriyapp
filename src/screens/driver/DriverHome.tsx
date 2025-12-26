import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const YELLOW = '#FFD500';

/* 👷 Firmalar (statik) */
type ChatMessage = {
  id: string;
  companyName: string;
  companyLogo: ImageSourcePropType;
  text: string;
  time: string;
  isMine: boolean;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm3',
    companyName: 'ÖRNEK 3 HAFRİYAT',
    companyLogo: require('../../../assets/icons/excavator.png'),
    text: 'Kamyon sayısı artırıldı.',
    time: '09:25',
    isMine: false,
  },
  {
    id: 'm2',
    companyName: 'ÖRNEK 2 HAFRİYAT',
    companyLogo: require('../../../assets/icons/excavator.png'),
    text: 'Biz de Sancaktepe tarafındayız.',
    time: '09:18',
    isMine: false,
  },
  {
    id: 'm1',
    companyName: 'ÖRNEK 1 HAFRİYAT',
    companyLogo: require('../../../assets/icons/excavator.png'),
    text: 'Herkese merhaba, bugün Esenler yüklemesi var.',
    time: '09:15',
    isMine: false,
  },
];

const DriverHome = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  // şimdilik “benim firmam” mock
  // const currentCompany = COMPANIES[0];

  /* 🔌 SOCKET READY */
  const onIncomingMessage = (msg: ChatMessage) => {
    setMessages(prev => [msg, ...prev]);
  };
  const filteredMessages = messages.filter(m => m.companyName.toLowerCase().includes(search.toLowerCase()) || m.text.toLowerCase().includes(search.toLowerCase()));

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      companyName: 'ÖRNEK 1 HAFRİYAT', // şimdilik mock
      companyLogo: require('../../../assets/icons/excavator.png'),
      text: message,
      time: new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isMine: true,
    };

    // 🔌 socket.emit('send_message', newMessage)
    setMessages(prev => [newMessage, ...prev]);

    setMessage('');
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    return (
      <View style={styles.messageRow}>
        <View style={styles.icon}>
          <Image source={item.companyLogo} style={styles.logo} />
        </View>

        <View style={[styles.messageBubble, item.isMine && styles.myMessageBubble]}>
          <Text style={styles.companyName}>{item.companyName}</Text>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <Text style={styles.header}>GENEL MESAJLAR</Text>
      <TextInput placeholder="Mesajlarda ara..." value={search} onChangeText={setSearch} style={styles.search} />
      <FlatList style={{ flex: 1 }} inverted data={filteredMessages} keyExtractor={item => item.id} renderItem={renderItem} contentContainerStyle={{ padding: 16, paddingTop: 20 }} />
      <View style={styles.messageBox}>
        <TextInput placeholder="Mesaj yaz..." value={message} onChangeText={setMessage} style={styles.messageInput} />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendText}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: '2%',
    marginTop: '-13%',
  },

  search: {
    backgroundColor: '#F2F2F2',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingHorizontal: '5%',
    paddingVertical: '3%',
    marginBottom: 8,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },

  textArea: {
    flex: 1,
  },

  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  lastMessage: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },

  time: {
    fontSize: 11,
    color: '#888',
    alignSelf: 'flex-end', // ⬅️ en sona alır
    marginTop: 6,
  },

  messageBox: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
  },

  messageInput: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },

  sendButton: {
    backgroundColor: YELLOW,
    borderRadius: 20,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },

  sendText: {
    fontWeight: 'bold',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  messageBubble: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,

    // Android shadow
    elevation: 2,
  },

  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },

  messageText: {
    fontSize: 14,
  },

  logo: {
    width: 35,
    height: 35,
  },

  icon: {
    width: 50,
    height: 50,
    borderRadius: 29,
    backgroundColor: YELLOW,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,

    // Android shadow
    elevation: 4,
  },
  myMessageBubble: {
    backgroundColor: '#FFE680',
  },
});

export default DriverHome;
