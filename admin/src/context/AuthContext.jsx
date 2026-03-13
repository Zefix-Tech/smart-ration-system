import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = sessionStorage.getItem('srms_token');
            if (token) {
                try {
                    const res = await axios.get('http://localhost:5001/api/auth/verify', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data.valid) {
                        setAdmin(res.data.admin);
                    } else {
                        sessionStorage.removeItem('srms_token');
                    }
                } catch (err) {
                    sessionStorage.removeItem('srms_token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = (token, adminData) => {
        sessionStorage.setItem('srms_token', token);
        setAdmin(adminData);
    };

    const logout = () => {
        sessionStorage.removeItem('srms_token');
        setAdmin(null);
    };

    return (
        <AuthContext.Provider value={{ admin, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
