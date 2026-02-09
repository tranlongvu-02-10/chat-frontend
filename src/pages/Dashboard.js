import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getSocket, connectSocket } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const messagesEndRef = useRef(null);
    const socket = getSocket();

    // 1. Khởi tạo & Auth Check
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!token || !storedUser) {
            navigate('/');
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser);
            if (!parsedUser || !parsedUser.id) {
                throw new Error('Invalid user data');
            }
            setUser(parsedUser);
            connectSocket();
            fetchUsers();
        } catch (e) {
            console.error("Error parsing user data:", e);
            handleLogout();
        }
    }, [navigate]);

    // 2. Fetch Users
    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            if (res.data.success) {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const currentUser = JSON.parse(storedUser);
                    const otherUsers = res.data.data.filter(u => u._id !== currentUser.id);
                    setUsers(otherUsers);
                }
            }
        } catch (err) {
            console.error("Lỗi lấy danh sách user:", err);
        }
    };

    // 3. Socket Event Listeners
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        socket.on('userOnline', ({ userId }) => {
            setUsers(prev => prev.map(u =>
                u._id === userId ? { ...u, online: true } : u
            ));
        });

        socket.on('userOffline', ({ userId }) => {
            setUsers(prev => prev.map(u =>
                u._id === userId ? { ...u, online: false } : u
            ));
        });

        socket.on('receiveMessage', (message) => {
            if (selectedUser && (message.sender === selectedUser._id || message.receiver === selectedUser._id)) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();

                if (selectedUser && message.sender === selectedUser._id) {
                    socket.emit('markMessagesRead', { chatId: selectedUser._id, isGroup: false });
                }
            }
        });

        socket.on('messagesRead', ({ chatId, userId, count }) => {
            if (selectedUser && chatId === selectedUser._id) {
                setMessages(prev => prev.map(msg => {
                    if (msg.sender === user.id && !msg.readBy?.includes(userId)) {
                        return { ...msg, readBy: [...(msg.readBy || []), userId] };
                    }
                    return msg;
                }));
            }
        });

        return () => {
            socket.off('userOnline');
            socket.off('userOffline');
            socket.off('receiveMessage');
            socket.off('messagesRead');
        };
    }, [selectedUser, user]);

    // 4. Fetch Message History khi chọn User
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            try {
                const res = await api.get(`/messages/${selectedUser._id}?isGroup=false`);
                if (res.data.success) {
                    setMessages(res.data.data.reverse());
                    scrollToBottom();

                    const socket = getSocket();
                    if (socket) {
                        socket.emit('markMessagesRead', { chatId: selectedUser._id, isGroup: false });
                    }
                }
            } catch (err) {
                console.error("Lỗi lấy tin nhắn:", err);
            }
        };

        fetchMessages();
    }, [selectedUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 5. Gửi tin nhắn
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        const socket = getSocket();
        if (socket) {
            socket.emit('sendMessage', {
                content: newMessage,
                receiverId: selectedUser._id,
                isGroup: false
            });
            setNewMessage('');
        }
    };

    // 6. Logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const socket = getSocket();
        if (socket) socket.disconnect();
        navigate('/');
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="app-logo">
                        <div className="logo-icon">💬</div>
                        <h2>Chat App</h2>
                    </div>
                    <div className="user-info">
                        <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
                        <div className="user-details">
                            <span className="username">{user?.username}</span>
                            <span className="user-status">Active now</span>
                        </div>
                        <button onClick={handleLogout} className="logout-btn" title="Logout">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="search-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8" strokeWidth="2" />
                        <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input type="text" placeholder="Search conversations..." />
                </div>

                <div className="user-list">
                    {users.map(u => (
                        <div
                            key={u._id}
                            className={`user-item ${selectedUser?._id === u._id ? 'active' : ''}`}
                            onClick={() => setSelectedUser(u)}
                        >
                            <div className="user-avatar-wrapper">
                                <div className="user-avatar-chat">{u.username[0].toUpperCase()}</div>
                                <div className={`status-indicator ${u.online ? 'online' : 'offline'}`}></div>
                            </div>
                            <div className="user-chat-info">
                                <div className="user-chat-name">{u.username}</div>
                                <div className="user-chat-status">
                                    {u.online ? 'Online' : 'Offline'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-area">
                {selectedUser ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <div className="chat-avatar">{selectedUser.username[0].toUpperCase()}</div>
                                <div className="chat-user-details">
                                    <h3>{selectedUser.username}</h3>
                                    <span className={`chat-status ${selectedUser.online ? 'online' : 'offline'}`}>
                                        {selectedUser.online ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <div className="chat-actions">
                                <button className="action-btn" title="Call">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <button className="action-btn" title="Video call">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <polygon points="23 7 16 12 23 17 23 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <button className="action-btn" title="More">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                                        <circle cx="19" cy="12" r="1" fill="currentColor" />
                                        <circle cx="5" cy="12" r="1" fill="currentColor" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="messages-list">
                            {messages.map((msg, index) => {
                                const isMe = msg.sender === user.id;
                                return (
                                    <div
                                        key={index}
                                        className={`message-wrapper ${isMe ? 'sent' : 'received'}`}
                                    >
                                        {!isMe && (
                                            <div className="message-avatar">{selectedUser.username[0].toUpperCase()}</div>
                                        )}
                                        <div className="message-bubble">
                                            <div className="message-content">{msg.content}</div>
                                            {isMe && msg.readBy?.includes(selectedUser._id) && (
                                                <div className="message-status">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    Seen
                                                </div>
                                            )}
                                        </div>
                                        {isMe && (
                                            <div className="message-avatar sent-avatar">{user?.username?.[0]?.toUpperCase()}</div>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="input-area" onSubmit={handleSendMessage}>
                            <button type="button" className="attach-btn" title="Attach file">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="message-input"
                            />
                            <button type="button" className="emoji-btn" title="Emoji">
                                😊
                            </button>
                            <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="22" y1="2" x2="11" y2="13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="welcome-screen">
                        <div className="welcome-icon">💬</div>
                        <h2>Welcome, {user?.username}!</h2>
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;