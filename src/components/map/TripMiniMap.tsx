import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPickupCoordinates, getDestinationCoordinates } from '../../services/geoCoordinates';
import type { Trip } from '../../types';

interface Props {
  trip: Trip;
  height?: string;
  isLightTheme?: boolean;
}

export const TripMiniMap: React.FC<Props> = ({ trip, height = '180px', isLightTheme = false }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const pickup = getPickupCoordinates(trip.originDistrictId, trip.originSpot);
    const dest = getDestinationCoordinates(trip.destinationOfficeId);

    const map = L.map(containerRef.current, {
      center: [(pickup.lat + dest.lat) / 2, (pickup.lng + dest.lng) / 2],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    const tileUrl = isLightTheme
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(map);

    // Pickup Marker
    const pickupIcon = L.divIcon({
      html: `<div style="background:#10b981; border:2px solid #fff; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-size:13px;">🟢</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).addTo(map)
      .bindPopup(`<b>Посадка:</b> ${trip.originSpot}`);

    // Destination Marker
    const destIcon = L.divIcon({
      html: `<div style="background:#3b82f6; border:2px solid #fff; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-size:13px;">🏢</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker([dest.lat, dest.lng], { icon: destIcon }).addTo(map)
      .bindPopup(`<b>Прибуття:</b> ${trip.destinationOfficeName}`);

    // Route Polyline
    const polyline = L.polyline(
      [[pickup.lat, pickup.lng], [dest.lat, dest.lng]],
      { color: '#10b981', weight: 4, opacity: 0.8, dashArray: '6, 6' }
    ).addTo(map);

    map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [trip, isLightTheme]);

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color, #334155)', margin: '8px 0' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute',
        bottom: '6px',
        left: '8px',
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '600',
        zIndex: 500,
      }}>
        📍 {trip.originSpot} ➔ 🏢 {trip.destinationOfficeName}
      </div>
    </div>
  );
};
