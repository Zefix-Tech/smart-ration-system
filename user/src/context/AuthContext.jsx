import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = '/api/auth/user';

    useEffect(() => {
        const token = sessionStorage.getItem('srms_user_token');
        const storedUser = sessionStorage.getItem('srms_user_data');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        if (token) {
            checkAuth(token);
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async (token) => {
        try {
            const res = await axios.get('/api/user-portal/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
            sessionStorage.setItem('srms_user_data', JSON.stringify(res.data));
        } catch (err) {
            sessionStorage.removeItem('srms_user_token');
            sessionStorage.removeItem('srms_user_data');
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
            sessionStorage.setItem('srms_user_token', res.data.token);
            sessionStorage.setItem('srms_user_data', JSON.stringify(res.data.user));
            setUser(res.data.user);
            return true;
        }
        return false;
    };

    const logout = () => {
        sessionStorage.removeItem('srms_user_token');
        sessionStorage.removeItem('srms_user_data');
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
