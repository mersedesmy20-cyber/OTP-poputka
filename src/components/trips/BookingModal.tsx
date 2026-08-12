import React, { useState } from 'react';
import type { Trip } from '../../types';
import { X, Check, MapPin, User, MessageSquare } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
  onConfirmBooking: (trip: Trip, requestedSeats: number, pickupSpot: string, note?: string) => void;
}

export const BookingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  trip,
  onConfirmBooking,
}) => {
  if (!isOpen || !trip) return null;

  const defaultSpot = trip.stops[0]?.name || trip.originSpot;
  const [pickupSpot, setPickupSpot] = useState<string>(defaultSpot);
  const [requestedSeats, setRequestedSeats] = useState<number>(1);
  const [note, setNote] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmBooking(trip, requestedSeats, pickupSpot, note);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User color="var(--accent-green)" /> Бронювання місця в авто
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Ride Info Summary */}
        <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
            {trip.originDistrictName} ➡️ {trip.destinationOfficeName}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Водій: <strong>{trip.driverName}</strong> • Виїзд о <strong style={{ color: 'var(--accent-green)' }}>{trip.departureTime}</strong> ({trip.recurrence.label})
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Pickup Spot Selector */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} /> Оберіть зручну точку посадки
            </label>
            <select
              className="input-field"
              value={pickupSpot}
              onChange={(e) => setPickupSpot(e.target.value)}
            >
              <option value={trip.originSpot}>{trip.originSpot} (Початкова точка)</option>
              {trip.stops.map(s => (
                <option key={s.id} value={s.name}>{s.name} ({s.estimatedTime})</option>
              ))}
            </select>
          </div>

          {/* Seat Count */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={14} /> Кількість місць для бронювання
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[1, 2].map(num => (
                <button
                  key={num}
                  type="button"
                  disabled={num > trip.availableSeats}
                  className={`btn ${requestedSeats === num ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '10px' }}
                  onClick={() => setRequestedSeats(num)}
                >
                  {num} {num === 1 ? 'місце' : 'місця'}
                </button>
              ))}
            </div>
          </div>

          {/* Note to Driver */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MessageSquare size={14} /> Примітка для водія (необов'язково)
            </label>
            <input
              type="text"
              className="input-field"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="напр. Буду чекати біля входу о 07:40"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Скасувати
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              <Check size={18} /> Підтвердити бронювання
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
