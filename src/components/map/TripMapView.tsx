import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Trip, TripRequest } from '../../types';
import { getPickupCoordinates, getDestinationCoordinates } from '../../services/geoCoordinates';
import { Clock, Fuel, Car, Crosshair } from 'lucide-react';

interface Props {
  trips: Trip[];
  userRequests: TripRequest[];
  onOpenDetails: (trip: Trip) => void;
  onBookSeat: (trip: Trip, isQuick?: boolean) => void;
  currentUserId: string;
  isLightTheme?: boolean;
}

export const TripMapView: React.FC<Props> = ({
  trips,
  userRequests,
  onOpenDetails,
  onBookSeat,
  currentUserId,
  isLightTheme = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'to_office' | 'from_office'>('all');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Filtered trips
  const filteredTrips = trips.filter(t => {
    if (filterType === 'all') return true;
    return t.tripType === filterType;
  });

  // Custom Icon Factory
  const createCustomIcon = (type: 'pickup' | 'office' | 'user' | 'active') => {
    let bg = '#10b981'; // Green pickup
    let iconHtml = '🟢';
    let size = 32;

    if (type === 'office') {
      bg = '#3b82f6';
      iconHtml = '🏢';
      size = 36;
    } else if (type === 'user') {
      bg = '#ec4899';
      iconHtml = '📍';
      size = 32;
    } else if (type === 'active') {
      bg = '#f59e0b';
      iconHtml = '🚗';
      size = 38;
    }

    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${bg};
          border: 2px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          font-size: ${size * 0.45}px;
          cursor: pointer;
          transition: transform 0.2s;
        ">
          ${iconHtml}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [50.4501, 30.5234], // Kyiv Center
        zoom: 11,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      const tileUrl = isLightTheme
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.featureGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLightTheme]);

  // Update Markers on Trips change or Filter change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Office coordinates (Zhylianska HQ)
    const officeCoord = getDestinationCoordinates('off_zhylianska');
    const officeMarker = L.marker([officeCoord.lat, officeCoord.lng], {
      icon: createCustomIcon('office'),
      title: 'ГО ОТП Банк (Жилянська 43)',
    });
    officeMarker.bindPopup('<b>🏢 ГО ОТП Банк</b><br>вул. Жилянська, 43');
    markersGroup.addLayer(officeMarker);

    // Add Markers for each trip
    filteredTrips.forEach(trip => {
      const pickupCoords = getPickupCoordinates(trip.originDistrictId, trip.originSpot);
      const isSelected = selectedTrip?.id === trip.id;

      const marker = L.marker([pickupCoords.lat, pickupCoords.lng], {
        icon: createCustomIcon(isSelected ? 'active' : 'pickup'),
        title: `${trip.originDistrictName} (${trip.originSpot}) ➔ ${trip.destinationOfficeName}`,
      });

      marker.on('click', () => {
        setSelectedTrip(trip);
        drawRoute(trip);
      });

      markersGroup.addLayer(marker);
    });

    if (markersGroup.getLayers().length > 0 && !selectedTrip) {
      map.fitBounds(markersGroup.getBounds(), { padding: [40, 40], maxZoom: 14 });
    }
  }, [filteredTrips, selectedTrip]);

  // Draw Route Polyline
  const drawRoute = (trip: Trip) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    const pickup = getPickupCoordinates(trip.originDistrictId, trip.originSpot);
    const dest = getDestinationCoordinates(trip.destinationOfficeId);

    const latlngs: [number, number][] = [
      [pickup.lat, pickup.lng],
      [dest.lat, dest.lng],
    ];

    const polyline = L.polyline(latlngs, {
      color: '#10b981',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.8,
    }).addTo(map);

    routeLineRef.current = polyline;
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
  };

  // Find User's Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Геолокація не підтримується цим браузером.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;

        const map = mapInstanceRef.current;
        if (map) {
          if (userMarkerRef.current) {
            map.removeLayer(userMarkerRef.current);
          }

          const uMarker = L.marker([latitude, longitude], {
            icon: createCustomIcon('user'),
            title: 'Ви знаходитесь тут',
          }).addTo(map);

          uMarker.bindPopup('<b>📍 Ви тут</b><br>Шукаємо найближчі точки посадки...').openPopup();
          userMarkerRef.current = uMarker;

          map.setView([latitude, longitude], 13);
        }
      },
      () => {
        setIsLocating(false);
        alert('Не вдалося отримати вашу локацію. Будь ласка, дозвольте доступ у налаштуваннях.');
      },
      { timeout: 8000 }
    );
  };

  const isBooked = selectedTrip ? userRequests.some(r => r.tripId === selectedTrip.id && r.status === 'approved') : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', minHeight: '450px', position: 'relative' }}>
      {/* Top Filter Buttons Floating Bar */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        zIndex: 1000,
        display: 'flex',
        gap: '6px',
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '6px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
      }}>
        <button
          onClick={() => setFilterType('all')}
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: '700',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: filterType === 'all' ? 'var(--accent-green, #10b981)' : 'transparent',
            color: filterType === 'all' ? '#000' : '#fff',
            transition: 'all 0.2s',
          }}
        >
          Всі ({trips.length})
        </button>
        <button
          onClick={() => setFilterType('to_office')}
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: '700',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: filterType === 'to_office' ? 'var(--accent-green, #10b981)' : 'transparent',
            color: filterType === 'to_office' ? '#000' : '#fff',
            transition: 'all 0.2s',
          }}
        >
          🏢 До офісу
        </button>
        <button
          onClick={() => setFilterType('from_office')}
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: '700',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: filterType === 'from_office' ? 'var(--accent-green, #10b981)' : 'transparent',
            color: filterType === 'from_office' ? '#000' : '#fff',
            transition: 'all 0.2s',
          }}
        >
          🏡 Додому
        </button>
      </div>

      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{
          flex: 1,
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          zIndex: 1,
        }}
      />

      {/* Floating GPS Button */}
      <button
        onClick={handleLocateMe}
        title="Моя локація"
        style={{
          position: 'absolute',
          bottom: selectedTrip ? '220px' : '20px',
          right: '16px',
          zIndex: 1000,
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'var(--surface, #1e293b)',
          color: 'var(--accent-green, #10b981)',
          border: '2px solid var(--accent-green, #10b981)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'bottom 0.3s ease',
        }}
      >
        <Crosshair size={22} className={isLocating ? 'animate-spin' : ''} />
      </button>

      {/* Bottom Popup Card for Selected Trip */}
      {selectedTrip && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          right: '12px',
          zIndex: 1000,
          background: 'var(--surface, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '14px',
          padding: '14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          backdropFilter: 'blur(10px)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <span className={`badge ${selectedTrip.tripType === 'to_office' ? 'badge-green' : 'badge-purple'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                {selectedTrip.tripType === 'to_office' ? '🏢 До ГО Жилянська' : '🏡 Додому'}
              </span>
              <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main, #fff)', marginTop: '4px' }}>
                📍 {selectedTrip.originSpot} ({selectedTrip.originDistrictName})
              </div>
            </div>
            <button
              onClick={() => setSelectedTrip(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
            >
              ✕
            </button>
          </div>

          {/* Details Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', background: 'var(--bg-primary, #0f172a)', padding: '8px 10px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} color="var(--accent-green)" />
              <strong style={{ color: 'var(--accent-green)' }}>{selectedTrip.departureTime}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Car size={14} color="var(--accent-cyan)" />
              <span>{selectedTrip.vehicleInfo}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Fuel size={14} color="var(--accent-warning)" />
              <span>{selectedTrip.compensationAmount ? `${selectedTrip.compensationAmount} грн` : 'Безкоштовно'}</span>
            </div>
          </div>

          {/* Actions Row */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}
              onClick={() => onOpenDetails(selectedTrip)}
            >
              Деталі поїздки
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, fontSize: '12px', padding: '8px 12px', background: 'var(--accent-green, #10b981)' }}
              onClick={() => onBookSeat(selectedTrip, true)}
              disabled={selectedTrip.availableSeats <= 0 || selectedTrip.driverId === currentUserId || isBooked}
            >
              {selectedTrip.driverId === currentUserId
                ? 'Ваша поїздка'
                : isBooked
                ? 'Підтверджено'
                : selectedTrip.availableSeats > 0
                ? `Забронювати (${selectedTrip.availableSeats})`
                : 'Немає місць'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
