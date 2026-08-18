import React from 'react';
import type { Trip, TripRequest } from '../../types';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  trip: Trip;
  userRequests: TripRequest[];
  onBookSeat: (trip: Trip, isQuickBooking?: boolean) => void;
  onOpenDetails: (trip: Trip) => void;
  onShareTrip?: (trip: Trip) => void;
  currentUserId: string;
}

/** Shorten long location names for the feed view */
const shortenLocation = (name: string): string => {
  // "ГО ОТПБанк (Головний офіс)" → "ГО"
  if (name.toLowerCase().includes('го ') || name.toLowerCase().includes('головн')) {
    return 'ГО';
  }
  // "Троєщина (ТРЦ Район (зупинка))" → "Троєщина"
  const parenIndex = name.indexOf('(');
  if (parenIndex > 0) {
    return name.substring(0, parenIndex).trim();
  }
  return name;
};

export const TripCard: React.FC<Props> = ({
  trip,
  userRequests,
  onBookSeat,
  onOpenDetails,
  currentUserId,
}) => {
  const isDriver = trip.driverId === currentUserId;
  const existingRequest = userRequests.find(r => r.tripId === trip.id);
  const isBooked = existingRequest?.status === 'approved';
  const isPending = existingRequest?.status === 'pending';

  const origin = shortenLocation(trip.originDistrictName);
  const destination = shortenLocation(trip.destinationOfficeName);

  return (
    <div
      className="card compact-trip-card"
      onClick={() => onOpenDetails(trip)}
      style={{
        cursor: 'pointer',
        padding: '14px 16px',
        marginBottom: '8px',
      }}
    >
      {/* Row 1: Route + Time */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '15px',
          fontWeight: '700',
          color: 'var(--text-main)',
          minWidth: 0,
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: trip.tripType === 'to_office' ? 'var(--accent-green)' : 'var(--accent-purple)',
            flexShrink: 0,
          }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {origin} → {destination}
          </span>
        </div>

        <span style={{
          fontSize: '15px',
          fontWeight: '800',
          color: 'var(--accent-green)',
          flexShrink: 0,
          marginLeft: '12px',
        }}>
          {trip.departureTime}
        </span>
      </div>

      {/* Row 2: Driver + Action */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <img
            src={trip.driverAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={trip.driverName}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--border-color)',
              flexShrink: 0,
            }}
          />
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {trip.driverName}
          </span>
        </div>

        <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
          {isDriver ? (
            <button className="btn btn-outline btn-compact" onClick={() => onOpenDetails(trip)}>
              Керувати
            </button>
          ) : isBooked ? (
            <button className="btn btn-booked btn-compact" onClick={() => onOpenDetails(trip)}>
              <CheckCircle2 size={13} /> Готово
            </button>
          ) : isPending ? (
            <button className="btn btn-pending btn-compact" onClick={() => onOpenDetails(trip)}>
              Очікує
            </button>
          ) : trip.availableSeats > 0 ? (
            <button
              className="btn btn-primary btn-compact"
              onClick={() => onBookSeat(trip, true)}
            >
              Забронювати
            </button>
          ) : (
            <button className="btn btn-secondary btn-compact" disabled>
              Зайнято
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
