import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Calendar, AlertCircle } from 'lucide-react';
import '../styles/pages.css';

const Stock = () => {
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStock = async () => {
            try {
                const token = sessionStorage.getItem('srms_user_token');
                const res = await axios.get('http://localhost:5001/api/user-portal/stock', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStock(res.data);
            } catch (err) {
                console.error('Failed to fetch stock');
            } finally {
                setLoading(false);
            }
        };
        fetchStock();
    }, []);

    return (
        <div className="page-container">
            <header className="page-header">
                <h2><Package size={24} /> Available Ration Stock</h2>
                <p>Real-time stock availability in your allocated shop</p>
            </header>

            {loading ? (
                <div className="loading">Loading stock details...</div>
            ) : (
                <div className="table-card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Available Quantity</th>
                                <th>Unit</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stock.length > 0 ? stock.map((item, idx) => (
                                <tr key={idx}>
                                    <td><strong>{item.commodity.charAt(0).toUpperCase() + item.commodity.slice(1)}</strong></td>
                                    <td>{item.quantity}</td>
                                    <td>{item.unit || 'kg'}</td>
                                    <td>
                                        <span className={`badge ${item.quantity > 10 ? 'success' : 'warning'}`}>
                                            {item.quantity > 10 ? 'In Stock' : 'Low Stock'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="no-data">No stock data available for this shop.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="info-box">
                <AlertCircle size={20} />
                <p>Note: Stock levels are updated by the shop administrator after every transaction.</p>
            </div>
        </div>
    );
};

export default Stock;
