import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import MainPage from './pages/MainPage';

const App: React.FC = () => {
    // Initialize token state from localStorage
    const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
    const navigate = useNavigate();
    const location = useLocation();

    // This effect handles redirection logic based on authentication status
    useEffect(() => {
        if (token) {
            // If logged in, redirect away from auth page to main page
            if (location.pathname === '/auth') {
                navigate('/');
            }
        } else {
            // If not logged in, redirect any other path to the auth page
            if (location.pathname !== '/auth') {
                navigate('/auth');
            }
        }
    }, [token, navigate, location.pathname]);

    const handleLoginSuccess = (newToken: string) => {
        localStorage.setItem('authToken', newToken);
        setToken(newToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
        // Navigate is now handled by the useEffect
    };

    return (
        <Routes>
            <Route 
                path="/auth" 
                element={!token ? <AuthPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />} 
            />
            <Route 
                path="/*" 
                element={token ? <MainPage token={token} onLogout={handleLogout} /> : <Navigate to="/auth" />} 
            />
        </Routes>
    );
};

export default App;