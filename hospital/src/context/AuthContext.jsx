import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem('hospital_token');
        if (token) {
            // Simplified: In a real app, you'd verify the token with the backend
            // For now, we'll store basic hospital info in session
            const savedHospital = sessionStorage.getItem('hospital_info');
            if (savedHospital) setHospital(JSON.parse(savedHospital));
        }
        setLoading(false);
    }, []);

    const login = async (email, password, hospitalId) => {
        const res = await axios.post('http://localhost:5001/api/hospital/login', { email, password, hospitalId });
        if (res.data.success) {
            sessionStorage.setItem('hospital_token', res.data.token);
            sessionStorage.setItem('hospital_info', JSON.stringify(res.data.hospital));
            setHospital(res.data.hospital);
            return true;
        }
        return false;
    };

    const logout = () => {
        sessionStorage.removeItem('hospital_token');
        sessionStorage.removeItem('hospital_info');
        setHospital(null);
    };

    return (
        <AuthContext.Provider value={{ hospital, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
