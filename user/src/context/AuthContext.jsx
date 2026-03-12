import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = 'http://localhost:5001/api/auth/user';

    useEffect(() => {
        const token = localStorage.getItem('srms_user_token');
        if (token) {
            checkAuth(token);
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async (token) => {
        try {
            const res = await axios.get('http://localhost:5001/api/user-portal/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
        } catch (err) {
            localStorage.removeItem('srms_user_token');
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        const res = await axios.post(`${API_URL}/register`, userData);
        return res.data;
    };

    const login = async (phone, password) => {
        const res = await axios.post(`${API_URL}/login`, { phone, password });
        if (res.data.success) {
            localStorage.setItem('srms_user_token', res.data.token);
            setUser(res.data.user);
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem('srms_user_token');
        setUser(null);
        window.location.href = '/login';
    };

    const getCities = async () => {
        const res = await axios.get(`${API_URL}/cities`);
        return res.data;
    };

    const getShops = async (cityId) => {
        const res = await axios.get(`${API_URL}/shops/${cityId}`);
        return res.data;
    };

    return (
        <AuthContext.Provider value={{ 
            user, login, logout, register, loading, 
            getCities, getShops 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
