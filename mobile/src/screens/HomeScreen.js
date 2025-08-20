import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import io from 'socket.io-client';

export default function HomeScreen({ navigation }) {
  const { token, user, API_URL, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data.users);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({ headerRight: () => (
      <TouchableOpacity onPress={logout}>
        <Text style={{ color: '#2e7dff' }}>Logout</Text>
      </TouchableOpacity>
    ) });
    fetchUsers();
    const s = io(API_URL, { auth: { token } });
    const onPresence = ({ userId, isOnline, lastSeenAt }) => {
      setUsers((prev) => prev.map((u) => (String(u.id) === String(userId) ? { ...u, isOnline, lastSeenAt } : u)));
    };
    s.on('presence:update', onPresence);
    return () => {
      s.off('presence:update', onPresence);
      s.disconnect();
    };
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Chat', { userId: item.id, name: item.name, conversationId: item.conversationId })}>
      <View style={[styles.avatar, { backgroundColor: item.isOnline ? '#2e7dff' : '#999' }]}>
        <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.last}>{item.lastMessageText || 'Start chatting'}</Text>
      </View>
      <View>
        <View style={[styles.dot, { backgroundColor: item.isOnline ? '#2ecc71' : '#bdc3c7' }]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchUsers} />}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f0f0f0', marginLeft: 76 }} />}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '700' },
  last: { color: '#666', marginTop: 2 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});


