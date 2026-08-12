import React, { useState } from 'react';
import type { District, Office, Vehicle, Trip, RecurrenceType, TripType, CompensationType } from '../../types';
import { X, Car, MapPin, Clock, Repeat, Fuel, Plus, Trash2, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (trip: Trip) => void;
  districts: District[];
  offices: Office[];
  vehicles: Vehicle[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  currentUserDepartment?: string;
  currentUserTelegram?: string;
  currentUserPhone?: string;
}

export const TripFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  districts,
  offices,
  vehicles,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserDepartment,
  currentUserTelegram,
  currentUserPhone,
}) => {
  if (!isOpen) return null;

  const defaultVehicle = vehicles[0] || {
    id: 'veh_default',
    make: 'Skoda',
    model: 'Octavia',
    color: 'Сірий',
    plateNumber: 'KA 7788 CB',
    seats: 4,
  };

  const [tripType, setTripType] = useState<TripType>('to_office');
  const [districtId, setDistrictId] = useState<string>(districts[0]?.id || '');
  const [originSpot, setOriginSpot] = useState<string>('ТРЦ Район (зупинка)');
  const [officeId] = useState<string>(offices[0]?.id || '');
  const [departureTime, setDepartureTime] = useState<string>('07:45');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('every_other_day');
  const [vehicleId, setVehicleId] = useState<string>(defaultVehicle.id);
  const [availableSeats, setAvailableSeats] = useState<number>(3);
  const [compensationType, setCompensationType] = useState<CompensationType>('fixed_contribution');
  const [compensationAmount, setCompensationAmount] = useState<number>(60);
  const [comment, setComment] = useState<string>('Їду до ГО Жилянська 43. З радістю підвезу колег!');
  const [stops, setStops] = useState<{ id: string; name: string; estimatedTime: string }[]>([
    { id: 'stop_1', name: 'м. Почайна', estimatedTime: '08:05' }
  ]);

  const selectedDistrict = districts.find(d => d.id === districtId) || districts[0];
  const selectedOffice = offices.find(o => o.id === officeId) || offices[0];
  const selectedVehicle = vehicles.find(v => v.id === vehicleId) || defaultVehicle;

  const handleAddStop = () => {
    if (stops.length >= 5) return;
    setStops([...stops, { id: 'stop_' + Date.now(), name: '', estimatedTime: '' }]);
  };

  const handleRemoveStop = (id: string) => {
    setStops(stops.filter(s => s.id !== id));
  };

  const getRecurrenceLabel = (type: RecurrenceType): string => {
    switch (type) {
      case 'every_other_day': return 'Через день (робочі дні)';
      case 'workdays': return 'Щодня у робочі дні';
      case 'mon_wed_fri': return 'Пн / Ср / Пт';
      case 'tue_thu': return 'Вт / Чт';
      default: return 'Разова поїздка';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newTrip: Trip = {
      id: 'trip_' + Date.now(),
      driverId: currentUserId,
      driverName: currentUserName,
      driverAvatar: currentUserAvatar,
      driverDepartment: currentUserDepartment,
      driverTelegram: currentUserTelegram,
      driverPhone: currentUserPhone,
      vehicleId: selectedVehicle.id,
      vehicleInfo: `${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.color})`,
      vehiclePlate: selectedVehicle.plateNumber,
      tripType,
      originDistrictId: selectedDistrict.id,
      originDistrictName: selectedDistrict.name,
      originSpot,
      destinationOfficeId: selectedOffice.id,
      destinationOfficeName: selectedOffice.name,
      destinationAddress: selectedOffice.address,
      departureDate: new Date().toISOString().split('T')[0],
      departureTime,
      recurrence: {
        type: recurrenceType,
        label: getRecurrenceLabel(recurrenceType),
      },
      availableSeats,
      initialSeats: availableSeats,
      approvalMode: 'manual',
      compensationType,
      compensationAmount: compensationType === 'fixed_contribution' ? compensationAmount : undefined,
      maxWaitMinutes: 5,
      luggageAllowed: true,
      childSeatAvailable: false,
      petsAllowed: false,
      comment,
      status: 'PUBLISHED',
      stops: [
        { id: 's_start', name: originSpot, estimatedTime: departureTime, order: 1 },
        ...stops.map((s, idx) => ({ id: s.id, name: s.name || 'Проміжна зупинка', estimatedTime: s.estimatedTime || departureTime, order: idx + 2 })),
        { id: 's_end', name: selectedOffice.name, estimatedTime: '08:35', order: stops.length + 2 }
      ],
      createdAt: new Date().toISOString(),
    };

    onSubmit(newTrip);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Car color="var(--accent-green)" /> Створити поїздку колегам
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Trip Type Selector */}
          <div className="input-group">
            <label className="input-label">Тип поїздки</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn ${tripType === 'to_office' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '13px', padding: '10px' }}
                onClick={() => setTripType('to_office')}
              >
                🌅 Вранці до ГО Жилянська 43
              </button>
              <button
                type="button"
                className={`btn ${tripType === 'from_office' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '13px', padding: '10px' }}
                onClick={() => setTripType('from_office')}
              >
                🌇 Увечері з ГО в район
              </button>
            </div>
          </div>

          {/* District & Pickup Spot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} /> {tripType === 'to_office' ? 'Ваш район' : 'Офіс відправлення'}</label>
              <select className="input-field" value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Точка зустрічі / Посадки</label>
              <input
                type="text"
                className="input-field"
                value={originSpot}
                onChange={(e) => setOriginSpot(e.target.value)}
                placeholder="напр. ТРЦ Район / м. Почайна"
                required
              />
            </div>
          </div>

          {/* Departure Time & Recurrence (Highlight "Через день") */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> Час виїзду</label>
              <input
                type="time"
                className="input-field"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Repeat size={13} /> Регулярність поїздки</label>
              <select
                className="input-field"
                value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                style={{ border: recurrenceType === 'every_other_day' ? '2px solid var(--accent-green)' : undefined }}
              >
                <option value="every_other_day">🔄 Через день (робочі дні)</option>
                <option value="workdays">📅 Щодня у робочі дні</option>
                <option value="mon_wed_fri">📆 Понеділок / Середа / П'ятниця</option>
                <option value="tue_thu">📆 Вівторок / Четвер</option>
                <option value="single">⚡ Разова поїздка (сьогодні)</option>
              </select>
            </div>
          </div>

          {/* Vehicle & Available Seats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Car size={13} /> Автомобіль</label>
              <select className="input-field" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plateNumber})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Вільних місць</label>
              <select className="input-field" value={availableSeats} onChange={(e) => setAvailableSeats(Number(e.target.value))}>
                <option value={1}>1 місце</option>
                <option value={2}>2 місця</option>
                <option value={3}>3 місця</option>
                <option value={4}>4 місця</option>
              </select>
            </div>
          </div>

          {/* Gas Compensation Rules */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Fuel size={13} /> Умови компенсації витрат</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <select
                className="input-field"
                value={compensationType}
                onChange={(e) => setCompensationType(e.target.value as CompensationType)}
              >
                <option value="fixed_contribution">💰 Фіксований внесок</option>
                <option value="free">🎁 Безкоштовно для колег</option>
                <option value="split_gas">⛽ Спліт чека за пальне</option>
              </select>

              {compensationType === 'fixed_contribution' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    className="input-field"
                    value={compensationAmount}
                    onChange={(e) => setCompensationAmount(Number(e.target.value))}
                    min={0}
                    step={10}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>грн</span>
                </div>
              )}
            </div>
          </div>

          {/* Intermediate Stops */}
          <div className="input-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="input-label" style={{ marginBottom: 0 }}>Проміжні зупинки (до 5 точок)</label>
              {stops.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddStop}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-green)', fontSize: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  <Plus size={14} /> Додати зупинку
                </button>
              )}
            </div>
            {stops.map((stop, idx) => (
              <div key={stop.id} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={`Зупинка ${idx + 1} (напр. м. Почайна)`}
                  value={stop.name}
                  onChange={(e) => {
                    const newStops = [...stops];
                    newStops[idx].name = e.target.value;
                    setStops(newStops);
                  }}
                  style={{ flex: 2 }}
                />
                <input
                  type="time"
                  className="input-field"
                  value={stop.estimatedTime}
                  onChange={(e) => {
                    const newStops = [...stops];
                    newStops[idx].estimatedTime = e.target.value;
                    setStops(newStops);
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveStop(stop.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0 6px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Driver Comment */}
          <div className="input-group">
            <label className="input-label">Коментар для колег</label>
            <textarea
              className="input-field"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Деталі маршруту, наявність музики, кондиціонера..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Скасувати
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              <Check size={18} /> Опублікувати поїздку
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
