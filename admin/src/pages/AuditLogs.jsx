import { useState, useEffect } from 'react';
import axios from 'axios';
import { LuHistory, LuShieldCheck, LuActivity } from 'react-icons/lu';
import DataTable from '../components/DataTable';
import '../styles/page.css';

const AuditLogs = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('srms_token');
            const res = await axios.get('http://localhost:5001/api/audit', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const columns = [
        { header: 'Action', accessor: 'action', render: (row) => (
            <span className="font-bold text-blue-600">{row.action}</span>
        )},
        { header: 'Module', accessor: 'module', render: (row) => (
            <span className="badge badge-gray">{row.module}</span>
        )},
        { header: 'Administrator', accessor: 'admin.name', render: (row) => (
            <div>
                <p className="font-semibold">{row.admin?.name}</p>
                <p className="text-xs text-gray-500">{row.admin?.role?.toUpperCase()}</p>
            </div>
        )},
        { header: 'Details', accessor: 'details', render: (row) => (
            <p className="text-xs text-gray-600 font-mono truncate max-w-xs" title={row.details}>
                {row.details}
            </p>
        )},
        { header: 'Timestamp', render: (row) => (
            <span className="text-xs text-gray-500">
                {new Date(row.createdAt).toLocaleString()}
            </span>
        )}
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title flex-item-center gap-2">
                        <LuHistory className="text-gray-700" /> Audit Logs
                    </h1>
                    <p className="page-subtitle">Security trail of all administrative actions and system modifications</p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                total={data.length}
                page={1}
                pages={1}
                onPageChange={() => {}}
            />
        </div>
    );
};

export default AuditLogs;
