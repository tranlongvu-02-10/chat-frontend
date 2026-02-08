import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import UserList from './components/UserList';
import ChatRoom from './components/ChatRoom';

const Dashboard = () => {
    const [selectedUser, setSelectedUser] = useState(null);

    return (
        <div style={{ display: 'flex' }}>
            <UserList onSelectUser={setSelectedUser} />
            {selectedUser ? (
                <ChatRoom selectedUser={selectedUser} />
            ) : (
                <div style={{ flex: 1, textAlign: 'center', paddingTop: '100px' }}>
                    Chọn một người để chat
                </div>
            )}
        </div>
    );
};

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;