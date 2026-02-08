import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            api.connectSocket(); // Kết nối socket sau khi login
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Đăng nhập thất bại');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto' }}>
            <h2>Đăng nhập</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ display: 'block', margin: '10px 0', width: '100%' }}
                />
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ display: 'block', margin: '10px 0', width: '100%' }}
                />
                <button type="submit" style={{ width: '100%' }}>Đăng nhập</button>
            </form>
            <p>
                Chưa có tài khoản? <a href="/register">Đăng ký</a>
            </p>
        </div>
    );
};

export default Login;