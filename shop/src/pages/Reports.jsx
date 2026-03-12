import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, BarChart2, PieChart, TrendingUp } from 'lucide-react';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend, 
    ArcElement 
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import '../styles/dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Reports = () => {
    const { admin } = useAuth();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('srms_shop_token');
            const res = await axios.get(`http://localhost:5001/api/shop-reports/${admin.shop._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportData(res.data);
        } catch (err) {
            console.error('Failed to fetch report data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (admin?.shop?._id) fetchReportData();
    }, [admin]);

    const barData = {
        labels: ['Rice', 'Wheat', 'Sugar', 'Kerosene'],
        datasets: [{
            label: 'Quantity Distributed (kg/L)',
            data: reportData ? [
                reportData.distribution.rice,
                reportData.distribution.wheat,
                reportData.distribution.sugar,
                reportData.distribution.kerosene
            ] : [0, 0, 0, 0],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
            borderRadius: 8,
        }]
    };

    const pieData = {
        labels: ['Rice', 'Wheat', 'Sugar', 'Kerosene'],
        datasets: [{
            data: reportData ? [
                reportData.distribution.rice,
                reportData.distribution.wheat,
                reportData.distribution.sugar,
                reportData.distribution.kerosene
            ] : [1, 1, 1, 1],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0,
        }]
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title flex-item-center gap-2">
                        <FileText color="#2563eb" /> Shop Reports & Analytics
                    </h1>
                    <p className="text-muted">Generate and export performance reports for your shop</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-primary btn-outline flex-item-center gap-2">
                        <Download size={18} /> Export PDF
                    </button>
                    <button className="btn-primary flex-item-center gap-2">
                        <Download size={18} /> Export CSV
                    </button>
                </div>
            </header>

            <div className="stat-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon-box blue-icon"><TrendingUp /></div>
                    <div className="stat-content">
                        <p className="stat-label">Monthly Orders</p>
                        <h3 className="stat-value">{reportData?.stats.monthlyOrders || 0}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-box green-icon"><BarChart2 /></div>
                    <div className="stat-content">
                        <p className="stat-label">Weekly Orders</p>
                        <h3 className="stat-value">{reportData?.stats.weeklyOrders || 0}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-box orange-icon"><PieChart /></div>
                    <div className="stat-content">
                        <p className="stat-label">Weekly Deliveries</p>
                        <h3 className="stat-value">{reportData?.stats.weeklyDelivery || 0}</h3>
                    </div>
                </div>
            </div>

            <div className="charts-row">
                <div className="chart-card">
                    <h3 className="chart-title">Monthly Distribution Breakdown</h3>
                    <div style={{ height: '300px' }}>
                        <Bar 
                            data={barData} 
                            options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
                        />
                    </div>
                </div>
                <div className="chart-card">
                    <h3 className="chart-title">Stock Usage Ratio</h3>
                    <div style={{ height: '300px' }}>
                        <Pie 
                            data={pieData} 
                            options={{ maintainAspectRatio: false }} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
