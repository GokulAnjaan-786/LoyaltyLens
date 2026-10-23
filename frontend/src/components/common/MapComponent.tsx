import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { safeArray, safeNumber, safeString } from '@/lib/safeData';

export interface CityData {
  city: string;
  latitude: number | null;
  longitude: number | null;
  total_customers?: number;
  churn_count?: number;
  high_risk_customers?: number;
  churn_percentage?: number;
  churn_rate_pct?: number;
  risk_level?: string;
  [key: string]: any;
}

interface MapComponentProps {
  cities?: CityData[];
  height?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ cities = [], height = '420px' }) => {
  // Default map center (center of India)
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  const cityList = safeArray<CityData>(cities);
  const validCities = cityList.filter(
    (c): c is CityData & { latitude: number; longitude: number } =>
      Boolean(c && typeof c.latitude === 'number' && typeof c.longitude === 'number' && !isNaN(c.latitude) && !isNaN(c.longitude))
  );

  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-[#E2E8F0] shadow-card relative z-0"
      style={{ height }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={5}
        scrollWheelZoom={false}
        className="w-full h-full"
        style={{ background: '#F8FAFC' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {validCities.map((c, idx) => {
          const lat = c.latitude as number;
          const lon = c.longitude as number;
          const cityName = safeString(c.city, `Region ${idx + 1}`);
          const total = safeNumber(c.total_customers, 0);
          const churnCount = safeNumber(c.churn_count ?? c.high_risk_customers, 0);
          const churnPct = safeNumber(c.churn_percentage ?? c.churn_rate_pct, 0);

          // Accessible risk color encoding
          let color = '#16A34A'; // Green (Low)
          if (churnPct > 50 || c.risk_level === 'HIGH') {
            color = '#DC2626'; // Red (High)
          } else if (churnPct > 25 || c.risk_level === 'MEDIUM') {
            color = '#D97706'; // Amber (Med)
          }

          const radius = Math.min(Math.max(total * 1.1, 7), 22);

          return (
            <CircleMarker
              key={`${cityName}-${idx}`}
              center={[lat, lon]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.65,
                weight: 2,
              }}
            >
              <Tooltip sticky direction="top">
                <div className="text-xs p-1 font-sans">
                  <p className="font-bold text-[#172033] text-sm">{cityName}</p>
                  <p className="text-[#64748B]">Total Accounts: <span className="font-semibold text-[#172033]">{total}</span></p>
                  <p className="text-[#DC2626]">High Risk: <span className="font-semibold">{churnCount}</span></p>
                  <p className="text-[#2563EB]">Churn Rate: <span className="font-semibold">{churnPct.toFixed(1)}%</span></p>
                </div>
              </Tooltip>
              <Popup>
                <div className="p-1 font-sans text-xs space-y-1.5 min-w-[160px]">
                  <div className="border-b border-[#E2E8F0] pb-1">
                    <h4 className="font-bold text-sm text-[#172033]">{cityName}</h4>
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">
                      {churnPct > 50 ? 'High Risk Zone' : churnPct > 25 ? 'Moderate Risk Zone' : 'Healthy Zone'}
                    </span>
                  </div>
                  <div className="space-y-1 text-[#64748B]">
                    <div className="flex justify-between">
                      <span>Total Base:</span>
                      <strong className="text-[#172033]">{total}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Vulnerable Users:</span>
                      <strong className="text-[#DC2626]">{churnCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Churn Rate:</span>
                      <strong className="text-[#172033]">{churnPct.toFixed(1)}%</strong>
                    </div>
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
