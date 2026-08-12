import React from 'react';
import type { Trip, TripRequest } from '../../types';
import { Clock, MapPin, Car, MessageCircle, Repeat, CheckCircle2, User, Fuel, Share2 } from 'lucide-react';

interface Props {
  trip: Trip;
  userRequests: TripRequest[];
  onBookSeat: (trip: Trip) => void;
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
        return ' Безкоштовно';
      case 'fixed_contribution':
        return ` ${trip.compensationAmount} грн / місце`;
      case 'split_gas':
        return ' Спліт за пальне';
      default:
        return ' За домовленістю';
    }
  };

  return (
    <div className="card" style={{ position: 'relative' }}>
      {/* Top Header info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className={`badge ${trip.tripType === 'to_office' ? 'badge-green' : 'badge-purple'}`}>
            {trip.tripType === 'to_office' ? '🏢 До ГО (Жилянська 43)' : '🏡 Додому в район'}
          </span>
          <span className="badge badge-blue">
            <Repeat size={12} /> {trip.recurrence.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', fontWeight: '800', color: 'var(--accent-green)' }}>
          <Clock size={16} /> {trip.departureTime}
        </div>
      </div>

      {/* Driver & Vehicle info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
        <img
          src={trip.driverAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
          alt={trip.driverName}
          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-green)' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: '700', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.driverName}</span>
            {trip.driverDepartment && (
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                {trip.driverDepartment}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Car size={13} style={{ color: 'var(--accent-cyan)' }} /> {trip.vehicleInfo}</span>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>
              {trip.vehiclePlate}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {onShareTrip && (
            <button
              className="icon-btn"
              title="Поділитися поїздкою"
              onClick={(e) => {
                e.stopPropagation();
                onShareTrip(trip);
              }}
              style={{ color: 'var(--accent-green)', borderColor: 'rgba(16,185,129,0.3)' }}
            >
              <Share2 size={16} />
            </button>
          )}

          {trip.driverTelegram && (
            <a
              href={`https://t.me/${trip.driverTelegram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="icon-btn"
              title="Написати водію в Telegram"
              onClick={(e) => e.stopPropagation()}
              style={{ color: '#0088cc', borderColor: 'rgba(0,136,204,0.4)' }}
            >
              <MessageCircle size={18} />
            </a>
          )}
        </div>
      </div>

      {/* Route Details */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
          <div style={{ color: 'var(--accent-green)', marginTop: '2px' }}><MapPin size={16} /></div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700' }}>
              Відправлення ({trip.originDistrictName})
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>{trip.originSpot}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{ color: 'var(--accent-cyan)', marginTop: '2px' }}><MapPin size={16} /></div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700' }}>
              Прибуття
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {trip.destinationOfficeName} ({trip.destinationAddress})
            </div>
          </div>
        </div>
      </div>

      {/* Seats & Compensation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-color)', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <User size={15} color="var(--accent-green)" />
          <span style={{ fontWeight: '700' }}>{trip.availableSeats}</span> з {trip.initialSeats} місць вільно
        </div>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Fuel size={14} /> {getCompensationLabel()}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="btn btn-secondary"
          style={{ flex: 1 }}
          onClick={() => onOpenDetails(trip)}
        >
          Деталі
        </button>

        {isDriver ? (
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => onOpenDetails(trip)}>
            Ваша поїздка (Керувати)
          </button>
        ) : isBooked ? (
          <button className="btn btn-primary" style={{ flex: 1, background: '#10b981' }} onClick={() => onOpenDetails(trip)}>
            <CheckCircle2 size={16} /> Місце підтверджено
          </button>
        ) : isPending ? (
          <button className="btn btn-secondary" style={{ flex: 1, color: 'var(--accent-warning)' }} onClick={() => onOpenDetails(trip)}>
            Очікує підтвердження
          </button>
        ) : trip.availableSeats > 0 ? (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onBookSeat(trip)}>
            Забронювати місце
          </button>
        ) : (
          <button className="btn btn-secondary" style={{ flex: 1 }} disabled>
            Місць немає
          </button>
        )}
      </div>
    </div>
  );
};
