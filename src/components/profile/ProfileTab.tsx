import React, { useState } from 'react';
import type { UserProfile, Vehicle, District } from '../../types';
import { Car, Plus, Trash2, CheckCircle2, RefreshCw, Mail, Phone, MessageCircle } from 'lucide-react';

interface Props {
  user: UserProfile;
  vehicles: Vehicle[];
  districts: District[];
  onAddVehicle: (v: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onResetAllData: () => void;
}

export const ProfileTab: React.FC<Props> = ({
  user,
  vehicles,
  onAddVehicle,
  onDeleteVehicle,
  onResetAllData,
}) => {
  const [showAddCar, setShowAddCar] = useState(false);
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Camry');
  const [color, setColor] = useState('Чорний');
  const [plateNumber, setPlateNumber] = useState('AA 5500 OP');
  const [seats] = useState(4);

  const handleCreateCar = (e: React.FormEvent) => {
    e.preventDefault();
    onAddVehicle({
      id: 'veh_' + Date.now(),
      ownerId: user.id,
      make,
      model,
      color,
      plateNumber,
      seats,
      isDefault: vehicles.length === 0,
    });
    setShowAddCar(false);
  };

  return (
    <div>
      {/* Profile Card */}
      <div className="card" style={{ textAlign: 'center', position: 'relative' }}>
        <img
          src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
          alt={user.name}
          style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-green)', margin: '0 auto 12px auto' }}
        />
        <h2 style={{ fontSize: '18px', fontWeight: '800' }}>
          {user.name} {user.surname}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: '600', marginBottom: '8px' }}>
          {user.department || 'ОТП Банк'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span className="badge badge-green">
            <CheckCircle2 size={12} /> Корпоративна пошта підтверджена
          </span>
          <span className="badge badge-blue">
            🏆 {user.completedTripsCount} успішних поїздок
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={15} color="var(--accent-green)" /> {user.email}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={15} color="var(--accent-cyan)" /> {user.phone || '+380 67 123 4567'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircle size={15} color="#0088cc" /> @{user.telegramUsername || 'alex_kovalenko_otp'}
          </div>
        </div>
      </div>

      {/* Vehicle Garage */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Car color="var(--accent-green)" /> Гараж авто ({vehicles.length})
          </h3>
          <button
            className="btn btn-outline"
            style={{ fontSize: '12px', padding: '6px 12px', minHeight: '34px' }}
            onClick={() => setShowAddCar(!showAddCar)}
          >
            <Plus size={14} /> Додати авто
          </button>
        </div>

        {showAddCar && (
          <form onSubmit={handleCreateCar} style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="input-group">
                <label className="input-label">Марка</label>
                <input type="text" className="input-field" value={make} onChange={(e) => setMake(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Модель</label>
                <input type="text" className="input-field" value={model} onChange={(e) => setModel(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Колір</label>
                <input type="text" className="input-field" value={color} onChange={(e) => setColor(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Держ. номер</label>
                <input type="text" className="input-field" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              Зберегти автомобілі
            </button>
          </form>
        )}

        {vehicles.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Автомобілі відсутні. Додайте авто, щоб пропонувати поїздки колегам.</p>
        ) : (
          vehicles.map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>{v.make} {v.model} ({v.color})</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Номер: <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{v.plateNumber}</span> • {v.seats} місць
                </div>
              </div>
              <button
                onClick={() => onDeleteVehicle(v.id)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '6px' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* System Actions */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Налаштування системи</h3>
        <button className="btn btn-danger" style={{ width: '100%' }} onClick={onResetAllData}>
          <RefreshCw size={16} /> Скинути тестові дані в початковий стан
        </button>
      </div>
    </div>
  );
};
