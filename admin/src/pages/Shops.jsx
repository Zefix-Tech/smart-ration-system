import { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../components/DataTable';
import { LuStore, LuMapPin, LuX, LuUser, LuPhone } from 'react-icons/lu';
import toast from 'react-hot-toast';
import '../styles/page.css';

const Shops = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedShop, setSelectedShop] = useState(null);
    const [formData, setFormData] = useState({
        shopId: '', name: '', ownerName: '', phone: '', address: '', district: '', latitude: '', longitude: ''
    });

    const fetchShops = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('srms_token');
            const res = await axios.get(`http://localhost:5001/api/shops?page=${page}&limit=10&search=${search}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data.shops);
            setPages(res.data.pages);
            setTotal(res.data.total);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load shops');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, [page, search]);

    const handleStatusChange = async (shopId, newStatus) => {
        if (!window.confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'disable' : 'enable'} this shop?`)) return;
        const loadingToast = toast.loading('Updating shop status...');
        try {
            const token = localStorage.getItem('srms_token');
            await axios.patch(`http://localhost:5001/api/shops/${shopId}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Shop ${newStatus === 'suspended' ? 'disabled' : 'enabled'} successfully`, { id: loadingToast });
            fetchShops();
        } catch (err) {
            console.error(err);
            toast.error('Failed to update shop status', { id: loadingToast });
        }
    };

    const handleOpenModal = (mode, shop = null) => {
        setModalMode(mode);
        if (shop) {
            setSelectedShop(shop);
            setFormData({
                shopId: shop.shopId, name: shop.name, ownerName: shop.ownerName, phone: shop.phone, 
                address: shop.address, district: shop.district, latitude: shop.latitude || '', longitude: shop.longitude || ''
            });
        } else {
            setSelectedShop(null);
            setFormData({ shopId: '', name: '', ownerName: '', phone: '', address: '', district: '', latitude: '', longitude: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedShop(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading(`${modalMode === 'add' ? 'Creating' : 'Updating'} shop...`);
        try {
            const token = localStorage.getItem('srms_token');
            const payload = {
                ...formData,
                latitude: parseFloat(formData.latitude) || 0,
                longitude: parseFloat(formData.longitude) || 0
            };

            if (modalMode === 'add') {
                await axios.post('http://localhost:5001/api/shops', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Shop created successfully', { id: loadingToast });
            } else {
                await axios.put(`http://localhost:5001/api/shops/${selectedShop._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Shop updated successfully', { id: loadingToast });
            }
            handleCloseModal();
            fetchShops();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Operation failed', { id: loadingToast });
        }
    };

    const columns = [
        { header: 'Shop ID', accessor: 'shopId', render: (row) => <div className="font-mono text-xs text-gray-500">{row.shopId}</div> },
        { header: 'Shop Name', accessor: 'name', render: (row) => <div className="font-semibold text-gray-900">{row.name}</div> },
        { header: 'Location', accessor: 'district', render: (row) => <div className="text-gray-600 text-sm">{row.district}</div> },
        { 
            header: 'Total Stock', 
            render: (row) => (
                <div className="flex-item gap-1 text-xs font-semibold">
                    <span className="badge badge-blue">R: {row.stock?.rice || 0}</span>
                    <span className="badge badge-orange">W: {row.stock?.wheat || 0}</span>
                    <span className="badge badge-green">S: {row.stock?.sugar || 0}</span>
                </div>
            ) 
        },
        { header: 'Users Served', accessor: 'usersServed', render: (row) => <span className="font-semibold text-gray-700">{row.usersServed}</span> },
        {
            header: 'Actions', render: (row) => (
                <div className="flex-item gap-2">
                    <button onClick={() => handleOpenModal('edit', row)} className="btn-action btn-action-blue">Edit</button>
                    <button onClick={() => handleStatusChange(row._id, row.status === 'active' ? 'suspended' : 'active')} className={`btn-action ${row.status === 'active' ? 'btn-action-red' : 'btn-action-green'}`}>
                        {row.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="page-container relative">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Ration Shops</h1>
                    <p className="page-subtitle">Manage Fair Price Shops and monitor local stock availability</p>
                </div>
                <button onClick={() => handleOpenModal('add')} className="btn-primary">
                    + Add New Shop
                </button>
            </div>

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                total={total}
                page={page}
                pages={pages}
                onPageChange={setPage}
                onSearch={(val) => { setSearch(val); setPage(1); }}
                searchPlaceholder="Search shop name, ID, or district..."
            />

            {/* Add / Edit Shop Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">{modalMode === 'add' ? 'Add New Ration Shop' : 'Edit Ration Shop'}</h3>
                            <button onClick={handleCloseModal} className="modal-close"><LuX size={20}/></button>
                        </div>
                        <div className="modal-body">
                            <form id="shopForm" onSubmit={handleSubmit} className="flex-col gap-3">
                                {/* Basic Information */}
                                <div>
                                    <h4 className="modal-section-title">Basic Information</h4>
                                    <div className="flex-col gap-2">
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Shop ID <span className="text-red-500">*</span></label>
                                            <div className="input-icon-wrapper">
                                                <LuStore  />
                                                <input type="text" className="form-input" value={formData.shopId} onChange={(e) => setFormData({...formData, shopId: e.target.value})} required disabled={modalMode === 'edit'} placeholder="e.g. SH-1001" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Shop Name <span className="text-red-500">*</span></label>
                                            <div className="input-icon-wrapper">
                                                <LuStore  />
                                                <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="e.g. Central Fair Price Shop" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Details */}
                                <div>
                                    <h4 className="modal-section-title">Contact Details</h4>
                                    <div className="flex-col gap-2">
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Owner/Incharge Name</label>
                                            <div className="input-icon-wrapper">
                                                <LuUser  />
                                                <input type="text" className="form-input" value={formData.ownerName} onChange={(e) => setFormData({...formData, ownerName: e.target.value})} placeholder="e.g. John Doe" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Contact Number</label>
                                            <div className="input-icon-wrapper">
                                                <LuPhone  />
                                                <input type="tel" pattern="[0-9]{10}" title="Ten digit mobile number" className="form-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="e.g. 9876543210" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Information */}
                                <div>
                                    <h4 className="modal-section-title">Location Information</h4>
                                    <div className="flex-col gap-2">
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">Full Address</label>
                                            <div className="input-icon-wrapper">
                                                <LuMapPin  />
                                                <input type="text" className="form-input" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="123 Main Street" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 relative">
                                            <label className="form-label">District <span className="text-red-500">*</span></label>
                                            <div className="input-icon-wrapper">
                                                <LuMapPin  />
                                                <input type="text" className="form-input" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} required placeholder="e.g. Chennai" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Geospatial Data Section */}
                                    <div className="mt-4 bg-gray-100 p-4 rounded-xl border border-gray-200">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <LuMapPin /> Map Coordinates (Optional)
                                        </h4>
                                        <div className="flex-col gap-2">
                                            <div className="flex flex-col gap-1 relative">
                                                <label className="text-xs font-semibold text-gray-600">Latitude</label>
                                                <input type="number" step="any" className="w-full p-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} placeholder="e.g. 13.0827" />
                                            </div>
                                            <div className="flex flex-col gap-1 relative">
                                                <label className="text-xs font-semibold text-gray-600">Longitude</label>
                                                <input type="number" step="any" className="w-full p-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} placeholder="e.g. 80.2707" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={handleCloseModal} className="btn-secondary">Cancel</button>
                            <button type="submit" form="shopForm" className="btn-primary">{modalMode === 'add' ? 'Create Shop' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Shops;
