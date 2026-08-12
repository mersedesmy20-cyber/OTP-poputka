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

  const topDistricts = districts.slice(0, 6);

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Quick Filter Pills Bar */}
      <div className="filter-chips-scroll">
        <button
          className={`chip-pill ${!hasActiveFilters ? 'active' : ''}`}
          onClick={onReset}
        >
          🔥 Усі поїздки
        </button>

        <button
          className={`chip-pill ${selectedTripType === 'to_office' ? 'active' : ''}`}
          onClick={() => onSelectTripType(selectedTripType === 'to_office' ? '' : 'to_office')}
        >
          🏢 До ГО Жилянська 43
        </button>

        <button
          className={`chip-pill ${selectedTripType === 'from_office' ? 'active' : ''}`}
          onClick={() => onSelectTripType(selectedTripType === 'from_office' ? '' : 'from_office')}
        >
          🏠 Додому в район
        </button>

        <button
          className={`chip-pill ${selectedRecurrence === 'every_other_day' ? 'active' : ''}`}
          onClick={() => onSelectRecurrence(selectedRecurrence === 'every_other_day' ? '' : 'every_other_day')}
        >
          🔄 Через день
        </button>

        {topDistricts.map(d => (
          <button
            key={d.id}
            className={`chip-pill ${selectedDistrictId === d.id ? 'active' : ''}`}
            onClick={() => onSelectDistrict(selectedDistrictId === d.id ? '' : d.id)}
          >
            📍 {d.name}
          </button>
        ))}
      </div>

      {/* Filter Card */}
      <div className="card" style={{ marginTop: '4px', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '15px' }}>
            <Filter size={18} color="var(--accent-green)" />
            Детальний фільтр
          </div>
          {hasActiveFilters && (
            <button
              onClick={onReset}
              style={{ background: 'none', border: 'none', color: 'var(--accent-green)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
            >
              <RefreshCw size={13} /> Скинути все
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          {/* District Filter */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} /> Район</label>
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
    </div>
  );
};
