import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { connectSocket } from '../services/api';
import './Register.css'; // Import CSS riêng

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!agreeTerms) {
            setError('Bạn cần đồng ý với Terms & Conditions');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/register', { username, email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            connectSocket();
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
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

            {/* Bên phải: Form đăng ký */}
            <div className="right-panel">
                <div className="form-wrapper">
                    <h2>Create an account</h2>
                    <p className="already-account">
                        Already have an account? <a href="/login">Log in</a>
                    </p>

                    <form onSubmit={handleRegister}>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group password-group">
                            <input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span className="eye-icon">👁</span>
                        </div>

                        <div className="terms-checkbox">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                            />
                            <label htmlFor="terms">
                                I agree to the <a href="#">Terms</a> & <a href="#">Conditions</a>
                            </label>
                        </div>

                        {error && <p className="error-msg">{error}</p>}

                        <button type="submit" className="create-btn" disabled={loading}>
                            {loading ? 'Creating...' : 'Create account'}
                        </button>
                    </form>

                    <div className="or-divider">
                        <span>Or register with</span>
                    </div>
                    {/* 
                    <div className="social-buttons">
                        <button className="google-btn">Google</button>
                        <button className="apple-btn">Apple</button>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default Register;