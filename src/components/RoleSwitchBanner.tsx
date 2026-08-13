import React from 'react';
import type { UserRoleMode } from '../types';
import { Car, UserCheck, MapPin } from 'lucide-react';

interface Props {
  currentRole: UserRoleMode;
  onSelectRole: (role: UserRoleMode) => void;
  onOpenCreateModal: () => void;
  onOpenFilter: () => void;
  userDistrictName?: string;
}

export const RoleSwitchBanner: React.FC<Props> = ({
  currentRole,
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
        marginBottom: '10px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.12))',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-active)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
        <MapPin size={14} color="var(--accent-green)" />
        <span>Ваш район: <strong>{userDistrictName}</strong></span>
      </div>

      <div>
        {currentRole === 'driver' ? (
          <button
            className="btn btn-primary"
            style={{ padding: '4px 10px', fontSize: '11px', height: '28px', gap: '4px' }}
            onClick={onOpenCreateModal}
          >
            <Car size={13} /> + Поїздка
          </button>
        ) : (
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11px', height: '28px', gap: '4px' }}
            onClick={onOpenFilter}
          >
            <UserCheck size={13} /> Знайти водія
          </button>
        )}
      </div>
    </div>
  );
};
