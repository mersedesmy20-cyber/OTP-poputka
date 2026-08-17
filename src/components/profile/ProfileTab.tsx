import React, { useState } from 'react';
import type { UserProfile, Vehicle, District } from '../../types';
import { Car, Plus, Trash2, CheckCircle2, RefreshCw, Mail, Phone, MessageCircle, Edit3, Save, Bot } from 'lucide-react';

interface Props {
  user: UserProfile;
  vehicles: Vehicle[];
  districts: District[];
  onSaveProfile: (updatedUser: UserProfile) => void;
  onAddVehicle: (v: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onResetAllData: () => void;
}

export const ProfileTab: React.FC<Props> = ({
  user,
  vehicles,
  districts,
  onSaveProfile,
  onAddVehicle,
  onDeleteVehicle,
  onResetAllData,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(user.name);
  const [surname, setSurname] = useState(user.surname);
  const [department, setDepartment] = useState(user.department || 'ОТП Банк');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [telegramUsername, setTelegramUsername] = useState(user.telegramUsername || '');
  const [districtId, setDistrictId] = useState(user.districtId || districts[0]?.id || '');

  const [showAddCar, setShowAddCar] = useState(false);
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Camry');
  const [color, setColor] = useState('Чорний');
  const [plateNumber, setPlateNumber] = useState('AA 5500 OP');
  const [seats, setSeats] = useState<number>(4);

  const isTelegramSession = !!window.Telegram?.WebApp?.initDataUnsafe?.user;

  const handleSaveProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...user,
      name,
      surname,
      department,
      email,
      phone,
      telegramUsername,
      districtId,
    });
    setIsEditingProfile(false);
  };

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
          src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
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
          {isTelegramSession ? (
            <span className="badge badge-green">
              <Bot size={13} /> Telegram підключено ({user.telegramUsername ? `@${user.telegramUsername}` : 'Без username'})
            </span>
          ) : (
            <span className="badge badge-green">
              <CheckCircle2 size={12} /> Корпоративна пошта підтверджена
            </span>
          )}
        </div>

        {/* Profile Edit Form or Display */}
        {isEditingProfile ? (
          <form onSubmit={handleSaveProfileSubmit} style={{ textAlign: 'left', background: 'var(--bg-primary)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="input-group">
                <label className="input-label">Ім'я</label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Прізвище</label>
                <input type="text" className="input-field" value={surname} onChange={(e) => setSurname(e.target.value)} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Підрозділ / Департамент</label>
              <input type="text" className="input-field" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="напр. IT Департамент" />
            </div>

            <div className="input-group">
              <label className="input-label">Корпоративний Email</label>
              <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="input-group">
                <label className="input-label">Телефон</label>
                <input type="text" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Telegram Username</label>
                <input type="text" className="input-field" value={telegramUsername} onChange={(e) => setTelegramUsername(e.target.value)} placeholder="без @" />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Основний район мешкання</label>
              <select className="input-field" value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.cityPart})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditingProfile(false)}>
                Скасувати
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <Save size={16} /> Зберегти
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={15} color="var(--accent-green)" /> {user.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={15} color="var(--accent-cyan)" /> {user.phone || 'Не вказано'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={15} color="#0088cc" /> {user.telegramUsername ? `@${user.telegramUsername}` : 'Не вказано'}
              </div>
            </div>

            <button className="btn btn-secondary" style={{ width: '100%', fontSize: '13px' }} onClick={() => setIsEditingProfile(true)}>
              <Edit3 size={15} /> Редагувати свій профіль
            </button>
          </div>
        )}
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
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Кількість місць для пасажирів</label>
                <input type="number" className="input-field" value={seats} min={1} max={8} onChange={(e) => setSeats(parseInt(e.target.value) || 4)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              Зберегти автомобіль
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
