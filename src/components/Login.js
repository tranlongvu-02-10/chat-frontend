import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { connectSocket } from '../services/api';
import './Login.css'; // Import CSS riêng

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            connectSocket(); // Kết nối socket sau khi login
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Bên trái: Hình nền + slogan */}
            <div className="left-panel">
                <div className="logo-back">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        Back to website →
                    </button>
                </div>
                <div className="slogan">
                    <h1>Capturing Moments,</h1>
                    <h1>Creating Memories</h1>
                </div>
            </div>

            {/* Bên phải: Form đăng nhập */}
            <div className="right-panel">
                <div className="form-wrapper">
                    <h2>Log in to your account</h2>
                    <p className="already-account">
                        Don't have an account? <a href="/register">Sign up</a>
                    </p>

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value.trim())}
                                required
                            />
                        </div>

                        <div className="input-group password-group">
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span className="eye-icon">👁</span>
                        </div>

                        <div className="forgot-password">
                            <a href="#">Forgot password?</a>
                        </div>

                        {error && <p className="error-msg">{error}</p>}

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Log in'}
                        </button>
                    </form>

                    <div className="or-divider">
                        <span>Or log in with</span>
                    </div>

                    <div className="social-buttons">
                        <button className="google-btn">Google</button>
                        <button className="apple-btn">Apple</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;