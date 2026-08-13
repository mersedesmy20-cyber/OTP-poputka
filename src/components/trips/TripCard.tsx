import React from 'react';
import type { Trip, TripRequest } from '../../types';
import { Clock, MapPin, Car, MessageCircle, CheckCircle2, User, Fuel, Share2 } from 'lucide-react';

interface Props {
  trip: Trip;
  userRequests: TripRequest[];
  onBookSeat: (trip: Trip, isQuickBooking?: boolean) => void;
  onOpenDetails: (trip: Trip) => void;
  onShareTrip?: (trip: Trip) => void;
  currentUserId: string;
}

export const TripCard: React.FC<Props> = ({
  trip,
  userRequests,
  onBookSeat,
  onOpenDetails,
  onShareTrip,
  currentUserId,
}) => {
  const isDriver = trip.driverId === currentUserId;
  const existingRequest = userRequests.find(r => r.tripId === trip.id);
  const isBooked = existingRequest?.status === 'approved';
  const isPending = existingRequest?.status === 'pending';

  const getCompensationLabel = () => {
    switch (trip.compensationType) {
      case 'free':
        return 'Безкоштовно';
      case 'fixed_contribution':
        return `${trip.compensationAmount} грн`;
      case 'split_gas':
        return 'Спліт за пальне';
      default:
        return 'Домовленість';
    }
  };

  return (
    <div
      className="card compact-trip-card"
      onClick={() => onOpenDetails(trip)}
      style={{
        position: 'relative',
        cursor: 'pointer',
        padding: '12px 14px',
        marginBottom: '10px',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* Line 1: Header - Direction Badge, Time, Compensation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className={`badge ${trip.tripType === 'to_office' ? 'badge-green' : 'badge-purple'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
            {trip.tripType === 'to_office' ? '🏢 До ГО' : '🏡 Додому'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
            {trip.recurrence.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Fuel size={12} /> {getCompensationLabel()}
          </span>
          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
            <Clock size={14} /> {trip.departureTime}
          </span>
        </div>
      </div>

      {/* Line 2: Route Main Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
        <MapPin size={15} color="var(--accent-green)" />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {trip.originDistrictName} ({trip.originSpot})
        </span>
        <span style={{ color: 'var(--text-dim)' }}>➔</span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--accent-cyan)' }}>
          {trip.destinationOfficeName}
        </span>
      </div>

      {/* Line 3: Driver Info + Seats + Quick Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <img
            src={trip.driverAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={trip.driverName}
            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--accent-green)' }}
          />
          <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', lineHeight: '1.2' }}>{trip.driverName}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Car size={11} color="var(--accent-cyan)" /> {trip.vehicleInfo} ({trip.vehiclePlate})
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Quick Telegram Chat Button */}
          {trip.driverTelegram && (
            <a
              href={`https://t.me/${trip.driverTelegram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="icon-btn"
              title="Написати в TG"
              onClick={(e) => e.stopPropagation()}
              style={{ width: '28px', height: '28px', color: '#0088cc', borderColor: 'rgba(0,136,204,0.3)', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <MessageCircle size={15} />
            </a>
          )}

          {/* Share Button */}
          {onShareTrip && (
            <button
              className="icon-btn"
              title="Поділитися"
              onClick={(e) => {
                e.stopPropagation();
                onShareTrip(trip);
              }}
              style={{ width: '28px', height: '28px', color: 'var(--accent-green)', borderColor: 'rgba(16,185,129,0.3)', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Share2 size={14} />
            </button>
          )}

          {/* Single Primary Action Button */}
          <div onClick={(e) => e.stopPropagation()}>
            {isDriver ? (
              <button className="btn btn-outline" style={{ fontSize: '11px', padding: '5px 10px', height: '30px' }} onClick={() => onOpenDetails(trip)}>
                Керувати
              </button>
            ) : isBooked ? (
              <button className="btn btn-primary" style={{ fontSize: '11px', padding: '5px 10px', height: '30px', background: '#10b981' }} onClick={() => onOpenDetails(trip)}>
                <CheckCircle2 size={13} /> Підтверджено
              </button>
            ) : isPending ? (
              <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '5px 10px', height: '30px', color: 'var(--accent-warning)' }} onClick={() => onOpenDetails(trip)}>
                Очікує
              </button>
            ) : trip.availableSeats > 0 ? (
              <button
                className="btn btn-primary"
                style={{ fontSize: '11px', padding: '5px 12px', height: '30px', whiteSpace: 'nowrap' }}
                onClick={() => onBookSeat(trip, true)}
                title="Забронювати в 1 клік"
              >
                <User size={12} /> Забронювати ({trip.availableSeats})
              </button>
            ) : (
              <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '5px 8px', height: '30px' }} disabled>
                Немає місць
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
