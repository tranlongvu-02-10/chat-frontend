import React, { useState, useEffect } from 'react';
import api, { getSocket } from '../services/api';

const UserList = ({ onSelectUser }) => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/users', { params: { onlineOnly: true, search } });
                setUsers(res.data.data);
            } catch (err) {
                console.error('Lỗi lấy user:', err);
            }
        };

        fetchUsers();

        const socket = getSocket();
        if (socket) {
            socket.on('userOnline', ({ userId }) => {
                setUsers(prev => prev.map(u => u._id === userId ? { ...u, online: true } : u));
            });
            socket.on('userOffline', ({ userId }) => {
                setUsers(prev => prev.map(u => u._id === userId ? { ...u, online: false } : u));
            });
        }

        return () => {
            if (socket) {
                socket.off('userOnline');
                socket.off('userOffline');
            }
        };
    }, [search]);

    return (
        <div style={{ width: '300px', borderRight: '1px solid #ccc', height: '100vh', overflowY: 'auto' }}>
            <h3>Người dùng online</h3>
            <input
                type="text"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '90%', margin: '10px' }}
            />
            {users.map(user => (
                <div
                    key={user._id}
                    onClick={() => onSelectUser(user)}
                    style={{
                        padding: '10px',
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                        background: user.online ? '#e0ffe0' : '#fff',
                    }}
                >
                    {user.username} {user.online && '(Online)'}
                </div>
            ))}
        </div>
    );
};

export default UserList;