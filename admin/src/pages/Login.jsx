import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LuShieldCheck, LuLock, LuMail, LuRefreshCw } from 'react-icons/lu';
import '../styles/login.css';

const Login = () => {
    const [email, setEmail] = useState('admin@srms.gov.in');
    const [password, setPassword] = useState('admin123');
    const [captcha, setCaptcha] = useState('');
    const [enteredCaptcha, setEnteredCaptcha] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    // Simple CAPTCHA generation
    const generateCaptcha = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptcha(result);
    };

    useEffect(() => {
        if (admin) {
            navigate('/');
        }
    }, [admin, navigate]);

    useEffect(() => {
        generateCaptcha();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (enteredCaptcha.toUpperCase() !== captcha) {
            setError('Invalid CAPTCHA code. Please try again.');
            generateCaptcha();
            setEnteredCaptcha('');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const res = await axios.post('http://localhost:5001/api/auth/login', { email, password });
            login(res.data.token, res.data.admin);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            generateCaptcha();
            setEnteredCaptcha('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <header className="gov-header">
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                    alt="Emblem of India"
                    className="gov-emblem"
                />
                <div className="gov-header-text">
                    <p className="gov-header-title">Government of India</p>
                    <p className="gov-header-dept">Ministry of Consumer Affairs</p>
                </div>
            </header>

            <main className="login-card-gov">
                <h1 className="portal-title">Smart Ration Management Portal</h1>
                <p className="portal-subtitle">PUBLIC DISTRIBUTION SYSTEM (PDS) ADMINISTRATION</p>

                {error && (
                    <div style={{ marginBottom: '1.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.8rem', padding: '0.75rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LuShieldCheck size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group-gov">
                        <label className="label-gov" htmlFor="email">
                            <LuMail size={12} style={{ marginRight: '4px' }} /> Administrator Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            placeholder="e.g. admin@srms.gov.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-gov"
                        />
                    </div>

                    <div className="form-group-gov">
                        <label className="label-gov" htmlFor="password">
                            <LuLock size={12} style={{ marginRight: '4px' }} /> Security Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-gov"
                        />
                    </div>

                    <div className="form-group-gov">
                        <label className="label-gov">Verification Code</label>
                        <div className="captcha-container">
                            <span className="captcha-image">{captcha}</span>
                            <button
                                type="button"
                                onClick={generateCaptcha}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0056b3' }}
                                title="Refresh CAPTCHA"
                            >
                                <LuRefreshCw size={18} />
                            </button>
                        </div>
                        <input
                            type="text"
                            required
                            placeholder="Enter above code"
                            value={enteredCaptcha}
                            onChange={(e) => setEnteredCaptcha(e.target.value)}
                            className="input-gov"
                            style={{ marginTop: '0.75rem' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-login-gov"
                    >
                        {isLoading ? 'Verifying Credentials...' : 'Secure Login'}
                    </button>
                </form>

                <div className="security-notice">
                    <p><strong>AUTHORIZED PERSONNEL ONLY</strong></p>
                    <p>This is a secure government system. Unauthorized access attempts are monitored and prohibited under the Information Technology Act.</p>
                </div>
            </main>

            <footer className="gov-footer">
                <p>© 2025 Government of India – Smart Ration Management System</p>
                <p style={{ marginTop: '0.25rem', opacity: 0.8 }}>National Informatics Centre (NIC) - PDS Division</p>
            </footer>
        </div>
    );
};

export default Login;
