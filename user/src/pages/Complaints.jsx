import { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Send, History } from 'lucide-react';
import '../styles/pages.css';

const Complaints = () => {
    const [formData, setFormData] = useState({ subject: '', message: '', category: 'service' });
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const token = sessionStorage.getItem('srms_user_token');
            const res = await axios.get('http://localhost:5001/api/user-portal/complaints', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComplaints(res.data);
        } catch (err) {
            console.error('Failed to fetch complaints');
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const token = sessionStorage.getItem('srms_user_token');
            await axios.post('http://localhost:5001/api/user-portal/complaints', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Complaint submitted successfully!');
            setFormData({ subject: '', message: '', category: 'service' });
            fetchComplaints();
        } catch (err) {
            setMessage('Failed to submit complaint.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h2><MessageSquare size={24} /> Complaints & Feedback</h2>
                <p>Register your grievances or provide feedback regarding services</p>
            </header>

            <div className="dashboard-grid">
                <section className="dashboard-section">
                    <h3>Submit New Complaint</h3>
                    {message && <div className="alert success">{message}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Subject</label>
                            <input 
                                type="text" 
                                value={formData.subject}
                                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                placeholder="Short summary of issue"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select 
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="quality">Food Quality</option>
                                <option value="quantity">Shortage / Quantity Issue</option>
                                <option value="service">Shop Staff Behavior</option>
                                <option value="fraud">Corruption / Overcharging</option>
                                <option value="other">Other Issues</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea 
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                                placeholder="Explain your issue in detail"
                                rows="4"
                                required
                            ></textarea>
                        </div>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Submitting...' : <><Send size={18} /> Submit Complaint</>}
                        </button>
                    </form>
                </section>

                <section className="dashboard-section side-section">
                    <h3><History size={20} /> Recent History</h3>
                    <div className="history-list">
                        {fetching ? <p>Loading history...</p> : 
                        complaints.length > 0 ? complaints.map((c) => (
                            <div key={c._id} className="history-card">
                                <div className="history-card-top">
                                    <strong>{c.subject}</strong>
                                    <span className={`badge ${c.status === 'resolved' ? 'success' : 'warning'}`}>
                                        {c.status}
                                    </span>
                                </div>
                                <p>{c.message.slice(0, 50)}...</p>
                                <span className="h-date">{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                        )) : <p>No complaints submitted yet.</p>}
                    </div>
                </section>
            </div>

            <style>{`
                .history-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
                .history-card { border: 1px solid #eee; padding: 1rem; border-radius: 8px; background: #fafafa; }
                .history-card-top { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .h-date { font-size: 0.75rem; color: #999; }
                .side-section { background: #fff !important; }
            `}</style>
        </div>
    );
};

export default Complaints;
