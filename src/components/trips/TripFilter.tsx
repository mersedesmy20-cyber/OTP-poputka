import React from 'react';
import type { District } from '../../types';
import { Filter, MapPin, RefreshCw, Layers } from 'lucide-react';

interface Props {
  districts: District[];
  selectedDistrictId: string;
  onSelectDistrict: (id: string) => void;
  selectedTripType: string;
  onSelectTripType: (type: string) => void;
  selectedRecurrence: string;
  onSelectRecurrence: (type: string) => void;
  onReset: () => void;
}

export const TripFilter: React.FC<Props> = ({
  districts,
  selectedDistrictId,
  onSelectDistrict,
  selectedTripType,
  onSelectTripType,
  selectedRecurrence,
  onSelectRecurrence,
  onReset,
}) => {
  const hasActiveFilters = selectedDistrictId !== '' || selectedTripType !== '' || selectedRecurrence !== '';

  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '15px' }}>
          <Filter size={18} color="var(--accent-green)" />
          Фільтр поїздок з районів
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            style={{ background: 'none', border: 'none', color: 'var(--accent-green)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
          >
            <RefreshCw size={13} /> Скинути
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
        {/* District Filter */}
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} /> Район відправлення</label>
          <select
            className="input-field"
            value={selectedDistrictId}
            onChange={(e) => onSelectDistrict(e.target.value)}
          >
            <option value="">Усі райони Києва</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.cityPart})</option>
            ))}
          </select>
        </div>

        {/* Direction Filter */}
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label">🏢 Напрямок</label>
          <select
            className="input-field"
            value={selectedTripType}
            onChange={(e) => onSelectTripType(e.target.value)}
          >
            <option value="">Усі напрямки</option>
            <option value="to_office">Вранці до ГО (Жилянська 43)</option>
            <option value="from_office">Увечері з ГО (Жилянська 43)</option>
          </select>
        </div>

        {/* Recurrence Filter */}
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Layers size={13} /> Графік руху</label>
          <select
            className="input-field"
            value={selectedRecurrence}
            onChange={(e) => onSelectRecurrence(e.target.value)}
          >
            <option value="">Усі графіки</option>
            <option value="every_other_day">🔄 Через день</option>
            <option value="workdays">📅 Робочі дні</option>
            <option value="single">⚡ Разова поїздка</option>
          </select>
        </div>
      </div>
    </div>
  );
};
