import React from 'react';
import type { District } from '../../types';
import { RefreshCw } from 'lucide-react';

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
  const topDistricts = districts.slice(0, 7);

  return (
    <div style={{ marginBottom: '10px' }}>
      {/* Quick Filter Pills Bar Only */}
      <div className="filter-chips-scroll" style={{ paddingBottom: '4px' }}>
        {hasActiveFilters && (
          <button
            className="chip-pill"
            onClick={onReset}
            style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <RefreshCw size={12} /> Скинути
          </button>
        )}

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
          🏢 До ГО
        </button>

        <button
          className={`chip-pill ${selectedTripType === 'from_office' ? 'active' : ''}`}
          onClick={() => onSelectTripType(selectedTripType === 'from_office' ? '' : 'from_office')}
        >
          🏠 Додому
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
    </div>
  );
};
