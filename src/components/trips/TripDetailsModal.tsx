import React, { useState } from 'react';
import type { Trip, TripRequest } from '../../types';
import { X, Clock, Car, MessageCircle, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
  requests: TripRequest[];
  currentUserId: string;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onUpdateDriverStatus: (tripId: string, status: Trip['driverLiveStatus']) => void;
  onUpdatePassengerStatus: (requestId: string, status: TripRequest['passengerLiveStatus']) => void;
}

export const TripDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  trip,
  requests,
  currentUserId,
  onApproveRequest,
  onRejectRequest,
  onUpdateDriverStatus,
  onUpdatePassengerStatus,
}) => {
  if (!isOpen || !trip) return null;

  const isDriver = trip.driverId === currentUserId;
  const tripRequests = requests.filter(r => r.tripId === trip.id);
  const myRequest = tripRequests.find(r => r.passengerId === currentUserId);

  const [localDriverStatus, setLocalDriverStatus] = useState<NonNullable<Trip['driverLiveStatus']>>(trip.driverLiveStatus || 'ready');

  const handleDriverStatusChange = (status: NonNullable<Trip['driverLiveStatus']>) => {
    setLocalDriverStatus(status);
    onUpdateDriverStatus(trip.id, status);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div>
            <span className="badge badge-green" style={{ fontSize: '11px', marginBottom: '4px' }}>
              {trip.recurrence.label}
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: '800' }}>
              {trip.originDistrictName} ➡️ {trip.destinationOfficeName}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Live Status Bar (Day of Ride) */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(16, 185, 129, 0.12))', border: '1px solid var(--accent-cyan)', margin: '0 0 16px 0' }}>
          <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} color="var(--accent-cyan)" /> Панель поїздки в день виїзду
          </div>

          {isDriver ? (
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Статус водія: <strong>{localDriverStatus === 'departed' ? '🟢 Ви вирушили!' : localDriverStatus === 'arrived' ? '📍 На точці!' : localDriverStatus === 'delayed_10' ? '⏳ Затримка 10 хв' : 'Очікування виїзду'}</strong>
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${localDriverStatus === 'departed' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '12px', padding: '6px 12px', minHeight: '36px' }}
                  onClick={() => handleDriverStatusChange('departed')}
                >
                  🟢 Я виїхав
                </button>
                <button
                  className={`btn ${localDriverStatus === 'arrived' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '12px', padding: '6px 12px', minHeight: '36px' }}
                  onClick={() => handleDriverStatusChange('arrived')}
                >
                  📍 Я на точці
                </button>
                <button
                  className={`btn ${localDriverStatus === 'delayed_10' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '12px', padding: '6px 12px', minHeight: '36px' }}
                  onClick={() => handleDriverStatusChange('delayed_10')}
                >
                  ⏱️ Затримуюсь (10 хв)
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Статус пасажира: <strong>{myRequest?.passengerLiveStatus === 'on_spot' ? '✅ На місці зустрічі' : myRequest?.passengerLiveStatus === 'delayed_5' ? '⏱️ Запізнююсь на 5 хв' : 'Підтверджено'}</strong>
              </p>
              {myRequest && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 12px', minHeight: '36px' }}
                    onClick={() => onUpdatePassengerStatus(myRequest.id, 'on_spot')}
                  >
                    ✅ Я на місці
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px', minHeight: '36px' }}
                    onClick={() => onUpdatePassengerStatus(myRequest.id, 'delayed_5')}
                  >
                    ⏱️ Запізнююсь (5 хв)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Driver Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
          <img
            src={trip.driverAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={trip.driverName}
            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-green)' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>{trip.driverName}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {trip.driverDepartment} • <Car size={13} /> {trip.vehicleInfo} ({trip.vehiclePlate})
            </div>
          </div>
          {trip.driverTelegram && (
            <a
              href={`https://t.me/${trip.driverTelegram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '8px 14px' }}
            >
              <MessageCircle size={15} /> Чат у Telegram
            </a>
          )}
        </div>

        {/* Route Stops Timeline */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-muted)' }}>
            Маршрут та зупинки ({trip.departureTime})
          </h3>
          <div style={{ borderLeft: '2px dashed var(--accent-green)', paddingLeft: '14px', marginLeft: '8px' }}>
            {trip.stops.map((stop, idx) => (
              <div key={stop.id} style={{ position: 'relative', marginBottom: '12px' }}>
                <div style={{ position: 'absolute', left: '-20px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: idx === 0 ? 'var(--accent-green)' : idx === trip.stops.length - 1 ? 'var(--accent-cyan)' : 'var(--text-dim)' }} />
                <div style={{ fontSize: '14px', fontWeight: '700' }}>{stop.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Час: {stop.estimatedTime}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Passengers List & Requests (Driver / Passenger View) */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-muted)' }}>
            Пасажири та заявки колег ({tripRequests.filter(r => r.status === 'approved').length} підтверджено)
          </h3>

          {tripRequests.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic' }}>Заявок поки немає. Місця вільні!</p>
          ) : (
            tripRequests.map(req => (
              <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {req.passengerName}
                    <span className={`badge ${req.status === 'approved' ? 'badge-green' : req.status === 'pending' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                      {req.status === 'approved' ? 'Підтверджено' : req.status === 'pending' ? 'Очікує' : 'Відхилено'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Точка: {req.pickupSpot} • {req.requestedSeats} місце
                  </div>
                </div>

                {isDriver && req.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => onApproveRequest(req.id)}>
                      <Check size={14} /> Прийняти
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--accent-danger)' }} onClick={() => onRejectRequest(req.id)}>
                      Відхилити
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};
