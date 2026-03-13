import { useState, useEffect } from 'react';
import axios from 'axios';
import { LuMap } from 'react-icons/lu';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import '../styles/page.css';

// Fix for default marker icons not showing in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;

const customIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const blueIcon = customIcon('blue');
const greenIcon = customIcon('green');

const MAP_CENTER = [11.1271, 78.6569]; // Tamil Nadu Center

const MapView = () => {
    const [shops, setShops] = useState([]);
    const [orphanages, setOrphanages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const token = sessionStorage.getItem('srms_token');
                
                // Fetch Shops
                const shopRes = await axios.get('http://localhost:5001/api/shops?limit=200', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setShops(shopRes.data.shops || []);

                // Fetch Orphanages 
                const orgRes = await axios.get('http://localhost:5001/api/admin/orphanages', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrphanages(orgRes.data || []);
                
            } catch (err) {
                console.error(err);
                toast.error('Failed to load map data');
            } finally {
                setLoading(false);
            }
        };
        fetchMapData();
    }, []);

    if (loading) return <div className="p-10 text-center">Initializing District Map Infrastructure...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title flex-item-center gap-2">
                        <LuMap className="text-green-600" /> Ration Shop Map View
                    </h1>
                    <p className="page-subtitle">Interactive OpenStreetMap of Fair Price Shops and Orphanages</p>
                </div>
            </div>

            <div className="chart-card" style={{ height: '70vh', padding: 0, position: 'relative', overflow: 'hidden' }}>
                <MapContainer center={MAP_CENTER} zoom={7} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Rendering Shops */}
                    {shops.map((shop) => (
                        (shop.latitude && shop.longitude) ? (
                            <Marker 
                                key={`shop-${shop._id}`} 
                                position={[shop.latitude, shop.longitude]} 
                                icon={blueIcon}
                            >
                                <Popup>
                                    <div className="min-w-[150px]">
                                        <h3 className="font-bold text-gray-800 mb-1">{shop.name}</h3>
                                        <p className="text-xs text-gray-600 mb-2">ID: {shop.shopId}</p>
                                        <p className="text-xs text-gray-600 mb-2">{shop.address}, {shop.district}</p>
                                        <div className="bg-gray-50 p-2 rounded border border-gray-200 mt-2">
                                            <h4 className="text-xs font-bold text-gray-700 uppercase mb-1 border-b pb-1">Stock</h4>
                                            <div className="text-xs">
                                                <div>Rice: {shop.stock?.rice || 0} kg</div>
                                                <div>Wheat: {shop.stock?.wheat || 0} kg</div>
                                                <div>Sugar: {shop.stock?.sugar || 0} kg</div>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ) : null
                    ))}

                    {/* Rendering Orphanages */}
                    {orphanages.map((org) => (
                        // Mocking lat/long for orphanages based on location string just so they render
                        // Provide diverse default coordinates scattered around Tamil Nadu for the demo
                        <Marker 
                            key={`org-${org._id}`} 
                            position={
                                org.location === 'Chennai' ? [13.0827, 80.2707] :
                                org.location === 'Madurai' ? [9.9252, 78.1198] :
                                org.location === 'Coimbatore' ? [11.0168, 76.9558] :
                                [10.7905, 78.7047] // Trichy
                            } 
                            icon={greenIcon}
                        >
                            <Popup>
                                <div className="min-w-[150px]">
                                    <h3 className="font-bold text-green-700 mb-1">{org.name}</h3>
                                    <p className="text-xs text-gray-600">{org.location}</p>
                                    <p className="text-xs font-semibold mt-1">Orphanage/NGO Target</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: '#fff', padding: '12px', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <p className="text-xs font-bold text-gray-700 mb-2">Map Legend</p>
                    <div className="flex-item-center gap-2 mb-1">
                        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" alt="blue marker" width={12} />
                        <span className="text-xs text-gray-600">Ration Shops</span>
                    </div>
                    <div className="flex-item-center gap-2">
                        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" alt="green marker" width={12} />
                        <span className="text-xs text-gray-600">Orphanages / NGOs</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapView;
