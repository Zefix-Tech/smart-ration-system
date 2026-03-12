import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, ChevronRight, ChevronLeft, MapPin, Store } from 'lucide-react';
import '../styles/auth.css';

const Register = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        aadhaar: '',
        rationCard: '',
        phone: '',
        address: '',
        password: '',
        cityId: '',
        shopId: ''
    });
    const [cities, setCities] = useState([]);
    const [shops, setShops] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, getCities, getShops } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (step === 2) {
            loadCities();
        }
    }, [step]);

    useEffect(() => {
        if (formData.cityId) {
            loadShops(formData.cityId);
        }
    }, [formData.cityId]);

    const loadCities = async () => {
        try {
            const data = await getCities();
            setCities(data);
        } catch (err) {
            setError('Failed to load cities');
        }
    };

    const loadShops = async (cityId) => {
        try {
            const data = await getShops(cityId);
            setShops(data);
        } catch (err) {
            setError('Failed to load shops');
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.name || !formData.aadhaar || !formData.rationCard || !formData.phone || !formData.password) {
                return setError('Please fill all required fields');
            }
            if (formData.aadhaar.length !== 12) {
                return setError('Aadhaar number must be 12 digits');
            }
        }
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => {
        setError('');
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.shopId) return setError('Please select a ration shop');
        
        setLoading(true);
        setError('');
        try {
            await register(formData);
            alert('Registration Successful! Please login.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Citizen Registration</h2>
                    <p>Step {step} of 3</p>
                    <div className="step-indicator">
                        <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                        <div className="step-line"></div>
                        <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                        <div className="step-line"></div>
                        <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                {step === 1 && (
                    <div className="step-content">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input name="name" value={formData.name} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Aadhaar Number (12 Digits)</label>
                            <input name="aadhaar" value={formData.aadhaar} onChange={handleInputChange} maxLength="12" required />
                        </div>
                        <div className="form-group">
                            <label>Ration Card Number</label>
                            <input name="rationCard" value={formData.rationCard} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Mobile Number</label>
                            <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input name="password" type="password" value={formData.password} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Home Address</label>
                            <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" required></textarea>
                        </div>
                        <button className="auth-btn" onClick={nextStep}>Next <ChevronRight size={18} /></button>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-content">
                        <h3><MapPin size={20} /> Select Your City</h3>
                        <div className="form-group">
                            <select name="cityId" value={formData.cityId} onChange={handleInputChange}>
                                <option value="">Select City</option>
                                {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                            </select>
                        </div>
                        <div className="auth-nav-btns" style={{ display: 'flex', gap: '10px' }}>
                            <button className="auth-btn secondary" onClick={prevStep}><ChevronLeft size={18} /> Back</button>
                            <button className="auth-btn" onClick={nextStep} disabled={!formData.cityId}>Next <ChevronRight size={18} /></button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-content">
                        <h3><Store size={20} /> Select Ration Shop</h3>
                        <div className="shop-grid">
                            {shops.length === 0 ? <p>No shops found in this city</p> : shops.map(shop => {
                                const isFull = (shop.membersCount || 0) >= 30;
                                return (
                                    <div 
                                        key={shop._id} 
                                        className={`shop-card ${formData.shopId === shop._id ? 'selected' : ''} ${isFull ? 'full' : ''}`}
                                        onClick={() => !isFull && setFormData({ ...formData, shopId: shop._id })}
                                    >
                                        <div className="shop-card-header">
                                            <span className="shop-name">{shop.name}</span>
                                            <span className={`shop-status ${isFull ? 'status-full' : 'status-available'}`}>
                                                {isFull ? 'Full' : 'Available'}
                                            </span>
                                        </div>
                                        <p className="shop-location">{shop.address}</p>
                                        <div className="members-count">
                                            Registered: {shop.membersCount || 0} / 30
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="auth-nav-btns" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="auth-btn secondary" onClick={prevStep}><ChevronLeft size={18} /> Back</button>
                            <button className="auth-btn" onClick={handleSubmit} disabled={loading || !formData.shopId}>
                                {loading ? 'Registering...' : 'Complete Registration'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login" className="auth-link">Login</Link></p>
                </div>
            </div>
            <style>{`
                .step-indicator { display: flex; align-items: center; justify-content: center; margin-top: 15px; }
                .step-dot { width: 30px; height: 30px; border-radius: 50%; background: #eee; display: flex; align-items: center; justify-content: center; color: #888; font-weight: 600; }
                .step-dot.active { background: var(--primary-color); color: white; }
                .step-line { flex: 1; max-width: 50px; height: 2px; background: #eee; margin: 0 5px; }
                .secondary { background: #6c757d; }
                .secondary:hover { background: #5a6268; }
            `}</style>
        </div>
    );
};

export default Register;
