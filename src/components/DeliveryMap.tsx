import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DeliveryMapProps {
  warehouseLocation: {
    lat: number;
    lng: number;
  };
  deliveryLocation: {
    lat: number;
    lng: number;
  };
}

export const DeliveryMap = ({ warehouseLocation, deliveryLocation }: DeliveryMapProps) => {
  // Calculate center point between warehouse and delivery location
  const centerLat = (warehouseLocation.lat + deliveryLocation.lat) / 2;
  const centerLng = (warehouseLocation.lng + deliveryLocation.lng) / 2;

  // Create custom icons
  const warehouseIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#ef4444" stroke="white" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    `),
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  const deliveryIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    `),
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border shadow-sm">
      <MapContainer
        center={[centerLat, centerLng] as [number, number]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Warehouse Marker */}
        <Marker 
          position={[warehouseLocation.lat, warehouseLocation.lng] as [number, number]} 
          icon={warehouseIcon as any}
        >
          <Popup>
            <div className="p-2">
              <p className="font-semibold text-sm">📦 Warehouse</p>
            </div>
          </Popup>
        </Marker>

        {/* Delivery Location Marker */}
        <Marker 
          position={[deliveryLocation.lat, deliveryLocation.lng] as [number, number]} 
          icon={deliveryIcon as any}
        >
          <Popup>
            <div className="p-2">
              <p className="font-semibold text-sm">📍 Delivery Address</p>
            </div>
          </Popup>
        </Marker>

        {/* Route Line */}
        <Polyline
          positions={[
            [warehouseLocation.lat, warehouseLocation.lng],
            [deliveryLocation.lat, deliveryLocation.lng],
          ] as [number, number][]}
          pathOptions={{ color: '#8b5cf6', weight: 3, opacity: 0.7, dashArray: '10, 10' }}
        />
      </MapContainer>
    </div>
  );
};
