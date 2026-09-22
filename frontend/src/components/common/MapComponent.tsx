import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface CityData {
  city: string;
  latitude: number | null;
  longitude: number | null;
  total_customers: number;
  high_risk_customers: number;
  churn_rate_pct: number;
}

interface MapComponentProps {
  cities: CityData[];
}

const MapComponent: React.FC<MapComponentProps> = ({ cities }) => {
  // Default map center (center of India)
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  const validCities = cities.filter(
    (c) => c.latitude !== null && c.longitude !== null
  );

  return (
    <div className="w-full h-[450px] rounded-xl overflow-hidden border border-slate-800 shadow-xl relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        scrollWheelZoom={false}
        className="w-full h-full"
        style={{ background: '#0f172a' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {validCities.map((c) => {
          const lat = c.latitude as number;
          const lon = c.longitude as number;

          // Color based on high risk / churn rate
          let color = '#10b981'; // Green (Low)
          if (c.churn_rate_pct > 50) color = '#ef4444'; // Red (High)
          else if (c.churn_rate_pct > 25) color = '#f59e0b'; // Amber (Med)

          const radius = Math.min(Math.max(c.total_customers * 1.2, 8), 24);

          return (
            <CircleMarker
              key={c.city}
              center={[lat, lon]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.6,
                weight: 2,
              }}
            >
              <Tooltip sticky direction="top">
                <div className="text-xs font-semibold">
                  <p className="font-bold text-slate-900">{c.city}</p>
                  <p className="text-slate-700">Customers: {c.total_customers}</p>
                  <p className="text-red-600">High Risk: {c.high_risk_customers}</p>
                  <p className="text-emerald-700">Churn Rate: {c.churn_rate_pct}%</p>
                </div>
              </Tooltip>
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-sm text-slate-900 border-b pb-1 mb-1">{c.city}</h4>
                  <div className="text-xs space-y-1">
                    <p><strong>Total Customers:</strong> {c.total_customers}</p>
                    <p><strong>High Risk Customers:</strong> {c.high_risk_customers}</p>
                    <p><strong>Churn Rate:</strong> <span className="font-bold text-red-600">{c.churn_rate_pct}%</span></p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
