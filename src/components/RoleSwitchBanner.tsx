import React from 'react';
import type { UserRoleMode } from '../types';
import { Car, UserCheck, MapPin, Plus } from 'lucide-react';

interface Props {
  currentRole: UserRoleMode;
  onSelectRole: (role: UserRoleMode) => void;
  onOpenCreateModal: () => void;
  onOpenFilter: () => void;
  userDistrictName?: string;
}

export const RoleSwitchBanner: React.FC<Props> = ({
  currentRole,
  onSelectRole,
  onOpenCreateModal,
  onOpenFilter,
  userDistrictName = 'Троєщина'
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        marginBottom: '12px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.12))',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-active, #334155)',
        gap: '8px',
        flexWrap: 'wrap',
      }}
    >
      {/* User District */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
        <MapPin size={14} color="var(--accent-green)" />
        <span>Район: <strong style={{ color: 'var(--accent-green)' }}>{userDistrictName}</strong></span>
      </div>

      {/* Role Toggle Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.25)',
          padding: '2px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={() => onSelectRole('passenger')}
            style={{
              background: currentRole === 'passenger' ? 'var(--accent-green, #10b981)' : 'transparent',
              color: currentRole === 'passenger' ? '#000' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '16px',
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
          >
            <UserCheck size={12} /> Пасажир
          </button>
          <button
            onClick={() => onSelectRole('driver')}
            style={{
              background: currentRole === 'driver' ? 'var(--accent-green, #10b981)' : 'transparent',
              color: currentRole === 'driver' ? '#000' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '16px',
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
          >
            <Car size={12} /> Водій
          </button>
        </div>

        {/* Action Button */}
        {currentRole === 'driver' ? (
          <button
            className="btn btn-primary"
            style={{ padding: '4px 10px', fontSize: '11px', height: '28px', gap: '4px', background: 'var(--accent-green)' }}
            onClick={onOpenCreateModal}
          >
            <Plus size={13} /> Створити
          </button>
        ) : (
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11px', height: '28px', gap: '4px' }}
            onClick={onOpenFilter}
          >
            Фільтри
          </button>
        )}
      </div>
    </div>
  );
};
