import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

export default function ChatScreen({ route }) {
  const { token, user, API_URL } = useAuth();
  const { userId: peerId, conversationId: initialConvId } = route.params;
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [conversationId, setConversationId] = useState(initialConvId || null);
  const [isTyping, setIsTyping] = useState(false);

  const me = useMemo(() => ({ _id: user?.id, name: user?.name }), [user]);

  useEffect(() => {
    const s = io(API_URL, { auth: { token } });
    s.emit('join:dm', { otherUserId: peerId });
    setSocket(s);
    return () => s.disconnect();
  }, [API_URL, token, peerId]);

  useEffect(() => {
    if (!socket) return;
    const onNew = (msg) => {
      if (String(msg.senderId) !== String(peerId) && String(msg.senderId) !== String(me._id)) return;
      setConversationId(msg.conversationId);
      setMessages((prev) => GiftedChat.append(prev, mapToGifted([msg])));
      if (String(msg.senderId) === String(peerId)) {
        socket.emit('message:read', { messageId: msg.id || msg._id });
      }
    };
    const onRead = ({ messageId, readAt }) => {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, readAt } : m)));
    };
    const onTyping = ({ fromUserId, typing }) => {
      if (String(fromUserId) === String(peerId)) setIsTyping(typing);
    };
    socket.on('message:new', onNew);
    socket.on('message:read', onRead);
    socket.on('typing:update', onTyping);
    return () => {
      socket.off('message:new', onNew);
      socket.off('message:read', onRead);
      socket.off('typing:update', onTyping);
    };
  }, [socket, peerId, me._id]);

  const mapToGifted = (msgs) => msgs.map((m) => ({
    _id: String(m.id || m._id),
    text: m.text,
    createdAt: new Date(m.createdAt),
    user: { _id: String(m.senderId) },
    sent: !!m.deliveredAt,
    received: !!m.deliveredAt,
    readAt: m.readAt,
  }));

  const fetchHistory = async () => {
    if (!conversationId) return;
    const res = await axios.get(`${API_URL}/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessages(mapToGifted(res.data.messages));
  };

  useEffect(() => {
    fetchHistory();
  }, [conversationId]);

  const onSend = useCallback((newMsgs = []) => {
    const text = newMsgs[0]?.text;
    if (!socket || !text) return;
    socket.emit('message:send', { toUserId: peerId, text }, (resp) => {
      if (resp?.ok) {
        setConversationId(resp.conversationId);
      }
    });
  }, [socket, peerId]);

  const onInputTextChanged = (txt) => {
    if (!socket) return;
    if (txt?.length) socket.emit('typing:start', { toUserId: peerId });
    else socket.emit('typing:stop', { toUserId: peerId });
  };

  return (
    <View style={{ flex: 1 }}>
      <GiftedChat
        messages={messages}
        onSend={(msgs) => onSend(msgs)}
        user={{ _id: String(me._id) }}
        onInputTextChanged={onInputTextChanged}
        isTyping={isTyping}
        renderUsernameOnMessage={false}
        showUserAvatar={false}
        scrollToBottom
        renderTicks={(currentMessage) => {
          const sent = currentMessage?.sent;
          const received = currentMessage?.received;
          const read = !!currentMessage?.readAt;
          return (
            <View style={{ flexDirection: 'row' }}>
              {sent && <View style={{ width: 6, height: 2, backgroundColor: read ? '#2e7dff' : '#999', marginRight: 2 }} />}
              {received && <View style={{ width: 6, height: 2, backgroundColor: read ? '#2e7dff' : '#999' }} />}
            </View>
          );
        }}
      />
    </View>
  );
}


