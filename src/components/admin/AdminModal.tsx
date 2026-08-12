import React, { useState } from 'react';
import type { District, Office, AppSettings, Complaint } from '../../types';
import { X, ShieldAlert, Settings, MapPin, Plus, Save, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  districts: District[];
  offices: Office[];
  settings: AppSettings;
  complaints: Complaint[];
  onAddDistrict: (d: District) => void;
  onSaveSettings: (s: AppSettings) => void;
}

export const AdminModal: React.FC<Props> = ({
  isOpen,
  onClose,
  districts,
  settings,
  complaints,
  onAddDistrict,
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'settings' | 'districts' | 'complaints'>('settings');
  const [appName, setAppName] = useState(settings.appName);
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newDistrictPart, setNewDistrictPart] = useState('Лівий берег');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      appName,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCreateDistrict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistrictName.trim()) return;

    onAddDistrict({
      id: 'dist_' + Date.now(),
      name: newDistrictName.trim(),
      cityPart: newDistrictPart,
      popularPickupSpots: ['Головна зупинка', 'Торговий центр'],
    });

    setNewDistrictName('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-warning)' }}>
            <ShieldAlert size={20} /> Панель Адміністратора OTP Carpool
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'var(--bg-primary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px', fontSize: '12px' }}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={14} /> Конфігурація
          </button>
          <button
            className={`btn ${activeTab === 'districts' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px', fontSize: '12px' }}
            onClick={() => setActiveTab('districts')}
          >
            <MapPin size={14} /> Райони ({districts.length})
          </button>
          <button
            className={`btn ${activeTab === 'complaints' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px', fontSize: '12px' }}
            onClick={() => setActiveTab('complaints')}
          >
            <ShieldAlert size={14} /> Скарги ({complaints.length})
          </button>
        </div>

        {/* Tab 1: Settings */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings}>
            <div className="input-group">
              <label className="input-label">Назва сервісу (Dynamic App Branding)</label>
              <input
                type="text"
                className="input-field"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="напр. OTP Попутник / Їдемо разом"
                required
              />
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Зміна назви зберігається в конфігурації без переписування коду.
              </p>
            </div>

            <div className="input-group">
              <label className="input-label">Головний Офіс Компанії</label>
              <input
                type="text"
                className="input-field"
                value={settings.mainOfficeAddress}
                disabled
              />
            </div>

            <div className="input-group">
              <label className="input-label">Дозволені поштові домени</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {settings.allowedDomains.map(d => (
                  <span key={d} className="badge badge-green">@{d}</span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <Save size={16} /> Зберегти налаштування
              </button>
              {savedSuccess && <span style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={16} /> Збережено!</span>}
            </div>
          </form>
        )}

        {/* Tab 2: Districts */}
        {activeTab === 'districts' && (
          <div>
            <form onSubmit={handleCreateDistrict} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Назва нового району (напр. Дарниця)"
                value={newDistrictName}
                onChange={(e) => setNewDistrictName(e.target.value)}
                style={{ flex: 2 }}
              />
              <select
                className="input-field"
                value={newDistrictPart}
                onChange={(e) => setNewDistrictPart(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="Правий берег">Правий берег</option>
                <option value="Лівий берег">Лівий берег</option>
                <option value="Передмістя">Передмістя</option>
              </select>
              <button type="submit" className="btn btn-primary" style={{ padding: '0 14px' }}>
                <Plus size={18} />
              </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
              {districts.map(d => (
                <div key={d.id} style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{d.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{d.cityPart}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Complaints */}
        {activeTab === 'complaints' && (
          <div>
            {complaints.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>
                Скарг немає. Усі поїздки здійснюються колегами в дружній атмосфері!
              </p>
            ) : (
              complaints.map(c => (
                <div key={c.id} style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--accent-danger)' }}>{c.category}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.description}</div>
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};
