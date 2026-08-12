import React from 'react';
import type { UserRoleMode } from '../types';
import { Car, UserCheck, Sparkles, MapPin } from 'lucide-react';

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
    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08))', borderColor: 'var(--border-active)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span className="badge badge-green" style={{ fontSize: '11px' }}>
          <Sparkles size={13} /> Корпоративні поїздки ГО ОТПБанк
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={13} color="var(--accent-green)" /> {userDistrictName}
        </span>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>
        {currentRole === 'driver' ? '🚗 Ви сьогодні Водій!' : '🚶‍♂️ Ви сьогодні Пасажир!'}
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
        {currentRole === 'driver'
          ? 'Запропонуйте поїздку колегам до ГО Жилянська 43 або назад у свій район. Можна налаштувати регулярний графік «Через день».'
          : 'Знайдіть колегу з вашого району, який їде до ГО Жилянська 43 або у зворотному напрямку.'}
      </p>

      {/* Action Buttons based on Role */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {currentRole === 'driver' ? (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onOpenCreateModal}>
            <Car size={18} /> Створити поїздку
          </button>
        ) : (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onOpenFilter}>
            <UserCheck size={18} /> Знайти водія з району
          </button>
        )}
      </div>
    </div>
  );
};
