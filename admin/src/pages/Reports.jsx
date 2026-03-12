import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { FileText, Download, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import '../styles/page.css';
import '../styles/dashboard.css'; // spinner

const Reports = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = localStorage.getItem('srms_token');
                const headers = { Authorization: `Bearer ${token}` };

                const [txRes, compRes, delRes, shopsRes] = await Promise.all([
                    axios.get('http://localhost:5001/api/admin/analytics/transactions-monthly', { headers }),
                    axios.get('http://localhost:5001/api/admin/analytics/complaint-resolution', { headers }),
                    axios.get('http://localhost:5001/api/admin/analytics/delivery-status', { headers }),
                    axios.get('http://localhost:5001/api/admin/analytics/top-ration-shops', { headers })
                ]);

                const formattedDistribution = txRes.data.labels.map((label, index) => ({
                    month: label,
                    amount: txRes.data.data[index]
                }));

                const totalDel = delRes.data.approved + delRes.data.rejected + delRes.data.pending;
                const deliveryApprovalRate = totalDel > 0 ? Math.round((delRes.data.approved / totalDel) * 100) : 0;
                
                const resolutionRate = compRes.data.resolutionRate || 0;

                setReportData({
                    monthlyDistribution: formattedDistribution,
                    complaintResolutionRate: resolutionRate,
                    totalComplaints: compRes.data.totalComplaints,
                    resolvedComplaints: compRes.data.resolvedComplaints,
                    approvedDeliveries: delRes.data.approved,
                    rejectedDeliveries: delRes.data.rejected,
                    pendingDeliveries: delRes.data.pending,
                    deliveryApprovalRate,
                    shopPerformance: shopsRes.data
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const exportPDF = () => {
        if (!reportData) return;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Smart Ration Management - System Report', 14, 22);

        doc.setFontSize(12);
        doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 14, 32);
        doc.text(`Delivery Request Approval Rate: ${reportData.deliveryApprovalRate}% (${reportData.approvedDeliveries}/${reportData.totalDeliveries})`, 14, 48);

        doc.autoTable({
            startY: 58,
            head: [['Shop ID', 'Name', 'Users Served', 'District']],
            body: reportData.shopPerformance.map(s => [s.shopId, s.name, s.usersServed, s.district]),
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save('SRMS_System_Report.pdf');
    };

    const exportCSV = () => {
        if (!reportData) return;
        const csvData = reportData.shopPerformance.map(s => ({
            'Shop ID': s.shopId,
            'Shop Name': s.name,
            'Users Served': s.usersServed,
            'District': s.district
        }));
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'SRMS_Shop_Performance.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title flex-item-center gap-2">
                        <FileText className="text-teal-600" /> Reports & Analytics
                    </h1>
                    <p className="page-subtitle">Generate and export system-wide performance reports</p>
                </div>
                <div className="flex-item gap-3">
                    <button onClick={exportCSV} className="btn-primary" style={{ backgroundColor: '#fff', color: '#374151', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Download /> Export CSV
                    </button>
                    <button onClick={exportPDF} className="btn-primary" style={{ backgroundColor: '#0d9488', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Download /> Export PDF
                    </button>
                </div>
            </div>

            <div className="report-grid">
                <div className="chart-card">
                    <h2 className="alert-heading" style={{ marginBottom: '1.5rem' }}>
                        <BarChart3 className="text-primary-500" /> Transactions Value by Month
                    </h2>
                    <div style={{ height: '16rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData?.monthlyDistribution || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="amount" name="Revenue (₹)" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card flex-item flex-col justify-center items-center" style={{ textAlign: 'center' }}>
                    <h2 className="alert-heading" style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}>
                        <PieChartIcon className="text-orange-500" /> Resolution Core metrics
                    </h2>
                    <div className="circular-progress-wrap" style={{ width: '100%', height: '220px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Resolved', value: reportData?.resolvedComplaints || 0 },
                                        { name: 'Unresolved', value: (reportData?.totalComplaints || 0) - (reportData?.resolvedComplaints || 0) }
                                    ]}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#14b8a6" />
                                    <Cell fill="#f3f4f6" />
                                </Pie>
                                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                            <span style={{ fontSize: '2.25rem', fontWeight: 900, color: '#1f2937' }}>{reportData?.complaintResolutionRate || 0}%</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginTop: '0.25rem' }}>Resolution Rate</span>
                        </div>
                    </div>
                    <div className="flex-item gap-3" style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }}>
                        <div className="metric-box" style={{ marginRight: '2rem' }}>
                            <p className="metric-label">Total Complaints</p>
                            <p className="metric-val">{reportData?.totalComplaints || 0}</p>
                        </div>
                        <div className="metric-box">
                            <p className="metric-label">Resolved</p>
                            <p className="metric-val" style={{ color: '#0d9488' }}>{reportData?.resolvedComplaints || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="chart-card">
                    <h2 className="alert-heading" style={{ marginBottom: '1.5rem' }}>
                        <BarChart3 className="text-orange-500" /> Delivery Requests Status
                    </h2>
                    <div className="flex-item gap-4" style={{ marginTop: '1rem' }}>
                        <div className="metric-box" style={{ flex: 1, padding: '1.5rem', background: '#f0fdf4', borderRadius: '1rem' }}>
                            <p className="metric-label" style={{ color: '#15803d' }}>Approved</p>
                            <p className="metric-val" style={{ color: '#16a34a' }}>{reportData?.approvedDeliveries || 0}</p>
                        </div>
                        <div className="metric-box" style={{ flex: 1, padding: '1.5rem', background: '#fef2f2', borderRadius: '1rem' }}>
                            <p className="metric-label" style={{ color: '#991b1b' }}>Rejected</p>
                            <p className="metric-val" style={{ color: '#dc2626' }}>{reportData?.rejectedDeliveries || 0}</p>
                        </div>
                        <div className="metric-box" style={{ flex: 1, padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem' }}>
                            <p className="metric-label">Pending</p>
                            <p className="metric-val">{reportData?.pendingDeliveries || 0}</p>
                        </div>
                    </div>
                    <div style={{ marginTop: '2rem' }}>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Overall Approval Rate</p>
                        <div className="progress-track" style={{ backgroundColor: '#e2e8f0', height: '0.75rem' }}>
                            <div className="progress-fill" style={{ width: `${reportData?.deliveryApprovalRate || 0}%`, backgroundColor: '#10b981', height: '0.75rem' }}></div>
                        </div>
                        <p className="text-right text-xs font-bold text-gray-500 mt-1">{reportData?.deliveryApprovalRate || 0}%</p>
                    </div>
                </div>
            </div>

            <div className="chart-card" style={{ padding: 0 }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #f3f4f6' }}>
                    <h2 className="alert-heading">Top Performing Ration Shops</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="report-table">
                        <thead>
                            <tr className="report-tr">
                                <th className="report-th">Shop ID</th>
                                <th className="report-th">Name</th>
                                <th className="report-th">District</th>
                                <th className="report-th" style={{ textAlign: 'right' }}>Users Served</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData?.shopPerformance.map((shop, i) => (
                                <tr key={i} className="report-tr">
                                    <td className="report-td font-mono">{shop.shopId}</td>
                                    <td className="report-td font-semibold text-gray-900">{shop.name}</td>
                                    <td className="report-td">{shop.district}</td>
                                    <td className="report-td" style={{ textAlign: 'right' }}>
                                        <span className="badge badge-blue border border-blue-100">
                                            {shop.usersServed}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
