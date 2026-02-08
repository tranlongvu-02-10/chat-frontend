import React, { useState, useEffect, useRef } from 'react';
import api, { getSocket } from '../services/api';

const ChatRoom = ({ selectedUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!selectedUser) return;

        const fetchHistory = async () => {
            try {
                const res = await api.get(`/messages/${selectedUser._id}`, {
                    params: { isGroup: false, page: 1, limit: 50 },
                });
                setMessages(res.data.data.reverse()); // đảo để mới nhất ở dưới
            } catch (err) {
                console.error('Lỗi load lịch sử:', err);
            }
        };

        fetchHistory();

        // Đánh dấu đã đọc khi mở phòng
        api.post('/messages/mark-read', {
            chatId: selectedUser._id,
            isGroup: false,
        });

        const socket = getSocket();
        if (socket) {
            socket.emit('joinChat', { chatId: selectedUser._id, isGroup: false });

            socket.on('receiveMessage', (msg) => {
                setMessages(prev => [...prev, msg]);
            });

            socket.on('messagesRead', ({ chatId, userId }) => {
                if (chatId === selectedUser._id) {
                    setMessages(prev =>
                        prev.map(m =>
                            m.sender._id !== currentUser.id && !m.readBy?.includes(userId)
                                ? { ...m, readBy: [...(m.readBy || []), userId] }
                                : m
                        )
                    );
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('receiveMessage');
                socket.off('messagesRead');
            }
        };
    }, [selectedUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        if (!newMessage.trim()) return;

        const socket = getSocket();
        if (socket) {
            socket.emit('sendMessage', {
                content: newMessage,
                receiverId: selectedUser._id,
                isGroup: false,
            });
        }

        setNewMessage('');
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <h3>Chat với {selectedUser?.username}</h3>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        style={{
                            margin: '8px 0',
                            textAlign: msg.sender._id === currentUser.id ? 'right' : 'left',
                        }}
                    >
                        <strong>{msg.sender.username}: </strong>
                        {msg.content}
                        {msg.readBy?.includes(currentUser.id) && msg.sender._id !== currentUser.id && (
                            <span style={{ fontSize: '10px', color: 'gray' }}> ✓✓ Đã xem</span>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: '10px', borderTop: '1px solid #ccc' }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Nhập tin nhắn..."
                    style={{ width: '80%' }}
                />
                <button onClick={sendMessage}>Gửi</button>
            </div>
        </div>
    );
};

export default ChatRoom;