import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
    LuUsers,
    LuStore,
    LuShoppingCart,
    LuTruck,
    LuInfo,
    LuShieldAlert,
    LuBot
} from 'react-icons/lu';
import '../styles/dashboard.css';

const StatCard = ({ title, value, icon, color, trend, description }) => {
    const iconClass = `stat-card-icon-wrapper icon-${color}`;
    const trendClass = trend ? (trend.startsWith('+') ? 'trend-up' : 'trend-down') : '';

    return (
        <div className="stat-card">
            <div className={iconClass}>
                {icon}
            </div>
            <div className="stat-card-content">
                <h3 className="stat-card-title">{title}</h3>
                <div className="stat-card-value-wrapper">
                    <p className="stat-card-value">{value}</p>
                    {trend && (
                        <span className={`stat-card-trend ${trendClass}`}>
                            {trend}
                        </span>
                    )}
                </div>
                {description && <p className="stat-card-desc">{description}</p>}
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [distributionData, setDistributionData] = useState([]);
    const [growthData, setGrowthData] = useState([]);
    const [usageData, setUsageData] = useState({ rice: 0, wheat: 0, sugar: 0 });
    const [loading, setLoading] = useState(true);

    const [prediction, setPrediction] = useState(null);
    const [predLoading, setPredLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = sessionStorage.getItem('srms_token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const [statsRes, distRes, growthRes, usageRes] = await Promise.all([
                    axios.get('http://localhost:5001/api/dashboard/stats', config),
                    axios.get('http://localhost:5001/api/dashboard/monthly-distribution', config),
                    axios.get('http://localhost:5001/api/dashboard/user-growth', config),
                    axios.get('http://localhost:5001/api/admin/analytics/current-month-usage', config)
                ]);

                setStats(statsRes.data);
                setDistributionData(distRes.data);
                setGrowthData(growthRes.data);
                setUsageData(usageRes.data);

                // Fetch AI separately to not block main fast renders
                axios.get('http://localhost:5001/api/admin/ai-stock-prediction', config)
                    .then(res => setPrediction(res.data))
                    .catch(err => console.error("ML Fetch Error:", err))
                    .finally(() => setPredLoading(false));
            } catch (error) {
                console.error('Error fetching dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    // Format pie chart data using dynamic usageData
    const pieData = [
        { name: 'Rice', value: usageData.rice },
        { name: 'Wheat', value: usageData.wheat },
        { name: 'Sugar', value: usageData.sugar }
    ];

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1 className="dashboard-title">System Overview</h1>
                <div className="dashboard-updated">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>

            <div className="stat-cards-grid">
                <StatCard 
                    title="Total Users" 
                    value={stats?.totalUsers || 0} 
                    icon={<LuUsers />} 
                    color="blue" 
                    trend="+12%" 
                    description="Registered ration card holders"
                />
                <StatCard 
                    title="Total Ration Shops" 
                    value={stats?.totalShops || 0} 
                    icon={<LuStore />} 
                    color="indigo" 
                    description="Active FPS outlets in TN"
                />
                <StatCard 
                    title="Total Orders" 
                    value={stats?.totalOrders || 0} 
                    icon={<LuShoppingCart />} 
                    color="green" 
                    trend="+5.2%" 
                    description="Successful transactions this month"
                />
                <StatCard 
                    title="Pending Deliveries" 
                    value={stats?.pendingDeliveries || 0} 
                    icon={<LuTruck />} 
                    color="yellow" 
                    description="Delivery requests awaiting approval"
                />
                <StatCard 
                    title="Total Complaints" 
                    value={stats?.totalComplaints || 0} 
                    icon={<LuInfo />} 
                    color="orange" 
                    trend="-2%" 
                    description="Issues reported by citizens"
                />
                <StatCard 
                    title="Fraud Alerts" 
                    value={stats?.fraudAlerts || 0} 
                    icon={<LuShieldAlert />} 
                    color="red" 
                    trend="+1" 
                    description="Suspicious activities detected"
                />
            </div>

            <div className="charts-grid-main">
                <div className="chart-card chart-card-col-2">
                    <h2 className="chart-card-title">Monthly Distribution Trends (2025)</h2>
                    <div className="chart-container-bar">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="rice" name="Rice" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="wheat" name="Wheat" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="sugar" name="Sugar" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <h2 className="chart-card-title">Current Month Usage</h2>
                    <div className="chart-container-pie">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="pie-legend-grid">
                        {pieData.map((item, index) => (
                            <div key={item.name} className="pie-legend-item">
                                <div className="pie-legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="pie-legend-name">{item.name}</span>
                                <span className="pie-legend-value">{item.value.toLocaleString()} kg</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="chart-card-full">
                <h2 className="chart-card-title">User Registration Growth</h2>
                <div className="chart-container-line">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={growthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Legend iconType="circle" />
                            <Line type="monotone" dataKey="users" name="New Registrations" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="chart-card-full" style={{ marginTop: '1.5rem' }}>
                <h2 className="chart-card-title flex-item-center gap-2">
                    <LuBot className="text-purple-600" /> Predicted Next Month Demand
                </h2>
                {predLoading ? (
                    <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
                ) : (
                    <div className="flex-item gap-4" style={{ marginTop: '1.25rem' }}>
                        <div className="metric-box" style={{ flex: 1, padding: '1.5rem', background: '#eff6ff', borderRadius: '1rem' }}>
                            <p className="metric-label" style={{ color: '#2563eb' }}>Rice</p>
                            <p className="metric-val" style={{ color: '#1d4ed8' }}>{prediction?.rice_prediction || 0} kg</p>
                        </div>
                        <div className="metric-box" style={{ flex: 1, padding: '1.5rem', background: '#fffbeb', borderRadius: '1rem' }}>
                            <p className="metric-label" style={{ color: '#d97706' }}>Wheat</p>
                            <p className="metric-val" style={{ color: '#b45309' }}>{prediction?.wheat_prediction || 0} kg</p>
                        </div>
                        <div className="metric-box" style={{ flex: 1, padding: '1.5rem', background: '#ecfdf5', borderRadius: '1rem' }}>
                            <p className="metric-label" style={{ color: '#059669' }}>Sugar</p>
                            <p className="metric-val" style={{ color: '#047857' }}>{prediction?.sugar_prediction || 0} kg</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
