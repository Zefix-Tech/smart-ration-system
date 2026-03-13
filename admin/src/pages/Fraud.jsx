import { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../components/DataTable';
import { LuShieldAlert, LuFlag, LuX } from 'react-icons/lu';
import '../styles/page.css';

const Fraud = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('srms_token');
            const res = await axios.get(`http://localhost:5001/api/fraud?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data.alerts);
            setPages(res.data.pages);
            setTotal(res.data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, [page]);

    const handleAction = async (id, status) => {
        const actionName = status === 'flagged' ? 'Flag User & Suspend' : status === 'dismissed' ? 'Dismiss Alert' : 'Mark Reviewed';
        if (!window.confirm(`Are you sure you want to ${actionName}?`)) return;

        try {
            const token = sessionStorage.getItem('srms_token');
            await axios.patch(`http://localhost:5001/api/fraud/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAlerts();
        } catch (err) {
            alert('Failed to process alert');
        }
    };

    const columns = [
        { header: 'User ID', accessor: 'user._id', render: (row) => <div className="font-mono text-xs text-gray-500">{row.user?._id?.slice(-8).toUpperCase() || 'N/A'}</div> },
        { header: 'Activity Type', accessor: 'activityType', render: (row) => (
            <div>
                <span className="font-semibold text-gray-800 text-sm text-capitalize">{row.activityType.replace('_', ' ')}</span>
                <div style={{ marginTop: '0.25rem' }}>
                    <span className="badge badge-gray" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {row._id.slice(0, 4) === '67c0' ? 'IDENTITY_MISMATCH' : 'VELOCITY_ALERT'}
                    </span>
                </div>
            </div>
        )},
        {
            header: 'Risk Level', render: (row) => (
                <span className={`badge-risk ${row.riskLevel === 'critical' ? 'badge-risk-critical' :
                    row.riskLevel === 'high' ? 'badge-risk-high' :
                        row.riskLevel === 'medium' ? 'badge-risk-medium' :
                            'badge-risk-low'
                    }`}>
                    {row.riskLevel.toUpperCase()}
                </span>
            )
        },
        { header: 'Date', render: (row) => <span className="text-sm text-gray-700">{new Date(row.detectedAt).toLocaleDateString()}</span> },
        {
            header: 'Status', render: (row) => (
                <span className={`badge ${row.status === 'flagged' ? 'badge-red' :
                    row.status === 'dismissed' ? 'badge-gray' :
                        row.status === 'reviewed' ? 'badge-blue' :
                            'badge-outline-orange'
                    }`}>
                    {row.status.toUpperCase()}
                </span>
            )
        },
        {
            header: 'Actions', render: (row) => (
                <div className="flex-item gap-2">
                    {row.status === 'new' && (
                        <>
                            <button onClick={() => handleAction(row._id, 'flagged')} className="btn-action btn-action-red flex-item-center p-2" style={{ position: 'relative' }} title="Flag User (Suspends Account)">
                                <LuFlag size={18} />
                                <div className="fraud-dot"></div>
                            </button>
                            <button onClick={() => handleAction(row._id, 'dismissed')} className="btn-action badge-gray p-2" title="Dismiss Alert">
                                <LuX size={18} />
                            </button>
                        </>
                    )}
                    {row.status === 'reviewed' && (
                        <button onClick={() => handleAction(row._id, 'flagged')} className="btn-action btn-action-red p-2" title="Flag User">
                            <LuFlag size={18} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title flex-item-center gap-2">
                        <LuShieldAlert className="text-red-500" /> Fraud Detection Alerts
                    </h1>
                    <p className="page-subtitle">AI-powered anomalies and suspicious activity monitoring</p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                total={total}
                page={page}
                pages={pages}
                onPageChange={setPage}
            />
        </div>
    );
};

export default Fraud;
