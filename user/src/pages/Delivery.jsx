import { useState } from 'react';
import axios from 'axios';
import { Truck, Upload, AlertCircle, CheckCircle, Lock, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/pages.css';

const DeliveryRequest = () => {
    const { user } = useAuth();
    
    // Eligibility Form State
    const [eligibilityData, setEligibilityData] = useState({ type: '', reason: '' });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    // Delivery Form State
    const [formData, setFormData] = useState({
        reason: '',
        description: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Handle Eligibility Submission
    const handleEligibilitySubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            return setMessage({ type: 'error', text: 'Please upload a supporting document.' });
        }
        
        setUploading(true);
        setMessage({ type: '', text: '' });
        
        try {
            const token = localStorage.getItem('srms_user_token');
            const data = new FormData();
            data.append('document', file);
            data.append('eligibilityType', eligibilityData.type);
            data.append('reason', eligibilityData.reason);

            await axios.post('http://localhost:5001/api/eligibility/upload', data, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            
            setMessage({ type: 'success', text: 'Eligibility verification submitted to admin.' });
            // Ideally we force a user context refresh here, but reloading the page is a quick sync
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Verification submission failed.' });
        } finally {
            setUploading(false);
        }
    };

    // Handle Actual Delivery Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('srms_user_token');
            // Re-using the same endpoint, but we don't pass certificateUrl anymore
            await axios.post('http://localhost:5001/api/user-portal/request-delivery', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: 'Delivery request submitted successfully!' });
            setFormData({ reason: '', description: '', address: '' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to submit request. Ensure all fields are filled.' });
        } finally {
            setLoading(false);
        }
    };

    const isPending = user?.eligibilityStatus === 'PENDING';
    const isVerified = user?.eligibilityStatus === 'VERIFIED';
    const isRejected = user?.eligibilityStatus === 'REJECTED';
    const isNone = !user?.eligibilityStatus || user?.eligibilityStatus === 'NONE';

    return (
        <div className="page-container">
            <header className="page-header">
                <h2><Truck size={24} /> Home Delivery Request</h2>
                <p>Special service for senior citizens, pregnant women, and injured citizens.</p>
            </header>

            {message.text && (
                <div className={`alert ${message.type}`}>
                    {message.text}
                </div>
            )}

            {isPending && (
                <div className="alert flex-item-center gap-2" style={{ marginBottom: '1.5rem', backgroundColor: '#fff8e1', color: '#ff8f00', border: '1px solid #ffe082', padding: '1rem', borderRadius: '0.5rem' }}>
                    <AlertCircle size={20} />
                    <strong>Status: </strong>
                    Eligibility verification pending admin approval.
                </div>
            )}

            {isVerified && (
                <div className="alert success flex-item-center gap-2" style={{ marginBottom: '1.5rem', backgroundColor: '#e0f2f1', color: '#00695c', border: '1px solid #b2dfdb', padding: '1rem', borderRadius: '0.5rem' }}>
                    <CheckCircle size={20} />
                    <strong>Verified: </strong>
                    Delivery request approved. You can now request ration delivery.
                </div>
            )}

            {isRejected && (
                <div className="alert error flex-item-center gap-2" style={{ marginBottom: '1.5rem', backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', padding: '1rem', borderRadius: '0.5rem' }}>
                    <AlertCircle size={20} />
                    <strong>Rejected: </strong>
                    Your previous eligibility request was rejected. Please submit a valid document.
                </div>
            )}

            {/* STEP 1: Eligibility Upload Form (Shown if NOT VERIFIED AND NOT PENDING) */}
            {(isNone || isRejected) && (
                <div className="form-card">
                    <div className="section-header" style={{ marginBottom: '15px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20} /> Delivery Eligibility Verification</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '5px' }}>You must verify your eligibility before requesting a delivery.</p>
                    </div>
                    
                    <form onSubmit={handleEligibilitySubmit}>
                        <div className="form-group">
                            <label>Select Eligibility Type</label>
                            <select 
                                value={eligibilityData.type} 
                                onChange={(e) => setEligibilityData({...eligibilityData, type: e.target.value})}
                                required
                            >
                                <option value="">Select Type</option>
                                <option value="Pregnant Woman">Pregnant Woman</option>
                                <option value="Senior Citizen (60+)">Senior Citizen (60+)</option>
                                <option value="Permanently Disabled">Permanently Disabled</option>
                                <option value="Medical Condition">Medical Condition</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Upload Supporting Document (Medical Certificate / ID Proof)</label>
                            <div className="file-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                                <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', margin: 0, padding: '0.5rem 1rem', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px' }}>
                                    <Upload size={16} /> Choose File
                                    <input type="file" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png" required />
                                </label>
                                <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                    {file ? file.name : 'No file selected (PDF, JPG)'}
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Reason for Request (Optional)</label>
                            <textarea 
                                placeholder="Enter any additional reason"
                                value={eligibilityData.reason}
                                onChange={(e) => setEligibilityData({...eligibilityData, reason: e.target.value})}
                                rows="2"
                            ></textarea>
                        </div>

                        <div className="submit-section" style={{ marginTop: '20px' }}>
                            <button type="submit" className="submit-btn" disabled={uploading}>
                                {uploading ? 'Submitting Verification...' : 'Submit Eligibility for Review'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* STEP 2: Actual Delivery Form (Shown only if VERIFIED) */}
            <div className="form-card" style={{ opacity: isVerified ? 1 : 0.5, pointerEvents: isVerified ? 'auto' : 'none', marginTop: '2rem' }}>
                <div className="section-header" style={{ marginBottom: '15px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={20} /> Request Delivery</h3>
                </div>
                {!isVerified && (
                    <div style={{ marginBottom: '15px', color: '#888', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Lock size={16} /> Form locked until eligibility is verified.
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Delivery Reason Category</label>
                        <select 
                            value={formData.reason} 
                            onChange={(e) => setFormData({...formData, reason: e.target.value})}
                            required
                        >
                            <option value="">Select Category</option>
                            <option value="pregnant">Pregnant Woman</option>
                            <option value="senior_citizen">Senior Citizen (60+)</option>
                            <option value="injured">Injured / Temporary Disability</option>
                            <option value="disabled">Permanently Disabled</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Secondary Address (if different from registered)</label>
                        <textarea 
                            placeholder="Enter delivery address"
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            rows="2"
                            required
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Additional Notes (Optional)</label>
                        <textarea 
                            placeholder="e.g. Near Big Temple, Second Street"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows="2"
                        ></textarea>
                    </div>

                    <div className="submit-section">
                        <button type="submit" className="submit-btn" disabled={loading || !isVerified}>
                            {loading ? 'Submitting...' : 'Request Delivery'}
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
};

export default DeliveryRequest;
