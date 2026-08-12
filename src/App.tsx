import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import type { UserProfile, UserRoleMode, Trip, TripRequest, Vehicle, District, Office, AppSettings, AppNotification } from './types';
import { RoleSwitchBanner } from './components/RoleSwitchBanner';
import { TripCard } from './components/trips/TripCard';
import { TripFilter } from './components/trips/TripFilter';
import { TripFormModal } from './components/trips/TripFormModal';
import { TripDetailsModal } from './components/trips/TripDetailsModal';
import { BookingModal } from './components/trips/BookingModal';
import { TelegramBotModal } from './components/telegram/TelegramBotModal';
import { AdminModal } from './components/admin/AdminModal';
import { ProfileTab } from './components/profile/ProfileTab';

import {
  Home,
  Search,
  PlusCircle,
  Car,
  User,
  Bot,
  Shield,
  Sparkles,
  Bell,
  CheckCircle2,
  X,
  Info,
  Sun,
  Moon,
  RefreshCw
} from 'lucide-react';
import './styles/theme.css';

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'medium') {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type);
  } catch (e) {
    // optional fallback
  }
}

export const App: React.FC = () => {
  // State from Storage Service
  const [user, setUser] = useState<UserProfile>(StorageService.getUser());
  const [roleMode, setRoleMode] = useState<UserRoleMode>(StorageService.getRoleMode());
  const [trips, setTrips] = useState<Trip[]>(StorageService.getTrips());
  const [requests, setRequests] = useState<TripRequest[]>(StorageService.getRequests());
  const [vehicles, setVehicles] = useState<Vehicle[]>(StorageService.getVehicles());
  const [districts, setDistricts] = useState<District[]>(StorageService.getDistricts());
  const [offices, setOffices] = useState<Office[]>(StorageService.getOffices());
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [notifications, setNotifications] = useState<AppNotification[]>(StorageService.getNotifications());

  // UI Active Navigation & Modals State
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'my_trips' | 'profile'>('home');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState<Trip | null>(null);
  const [bookingTripTarget, setBookingTripTarget] = useState<Trip | null>(null);

  // Theme State
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    return localStorage.getItem('otp_theme') === 'light';
  });

  const toggleTheme = () => {
    triggerHaptic('light');
    const newTheme = !isLightTheme;
    setIsLightTheme(newTheme);
    localStorage.setItem('otp_theme', newTheme ? 'light' : 'dark');
    if (newTheme) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  };

  useEffect(() => {
    if (isLightTheme) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [isLightTheme]);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filters State
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedTripType, setSelectedTripType] = useState<string>('');
  const [selectedRecurrence, setSelectedRecurrence] = useState<string>('');

  // Cloud Storage Sync State
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    triggerHaptic('light');
    const cloudTrips = await StorageService.syncFromCloud();
    setTrips(cloudTrips);
    setRequests(StorageService.getRequests());
    setIsSyncing(false);
    showToast('🔄 Стрічку поїздок оновлено з хмари!');
  };

  // Telegram WebApp Ready & Expand initialization
  useEffect(() => {
    try {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
    } catch (e) {
      console.error('Error initializing Telegram WebApp SDK', e);
    }
  }, []);

  useEffect(() => {
    // Initial fetch from global cloud store
    StorageService.syncFromCloud().then(cloudTrips => {
      setTrips(cloudTrips);
      setRequests(StorageService.getRequests());
    });

    // Auto sync every 8 seconds across all devices
    const interval = setInterval(() => {
      StorageService.syncFromCloud().then(cloudTrips => {
        setTrips(cloudTrips);
        setRequests(StorageService.getRequests());
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Storage listener for live state updates
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(StorageService.getUser());
      setRoleMode(StorageService.getRoleMode());
      setTrips(StorageService.getTrips());
      setRequests(StorageService.getRequests());
      setVehicles(StorageService.getVehicles());
      setDistricts(StorageService.getDistricts());
      setOffices(StorageService.getOffices());
      setSettings(StorageService.getSettings());
      setNotifications(StorageService.getNotifications());
    };

    window.addEventListener('otp_storage_updated', handleStorageChange);
    return () => window.removeEventListener('otp_storage_updated', handleStorageChange);
  }, []);

  // Handlers
  const handleRoleChange = (newRole: UserRoleMode) => {
    triggerHaptic('medium');
    setRoleMode(newRole);
    StorageService.setRoleMode(newRole);
  };

  const handleCreateTrip = (newTrip: Trip) => {
    triggerHaptic('heavy');
    StorageService.addTrip(newTrip);
    setTrips(StorageService.getTrips());
    showToast('🎉 Поїздку успішно опубліковано для колег!');
  };

  const handleOpenBookingModal = (trip: Trip) => {
    triggerHaptic('light');
    const existingReq = requests.find(r => r.tripId === trip.id && r.passengerId === user.id);
    if (existingReq) {
      showToast('⚠️ Ви вже забронювали місце на цю поїздку!');
      setSelectedTripDetails(trip);
      return;
    }
    setBookingTripTarget(trip);
  };

  const handleConfirmBooking = (trip: Trip, requestedSeats: number, pickupSpot: string, note?: string) => {
    triggerHaptic('heavy');
    const finalPickupSpot = note?.trim() ? `${pickupSpot} (${note.trim()})` : pickupSpot;
    const newRequest: TripRequest = {
      id: 'req_' + Date.now(),
      tripId: trip.id,
      passengerId: user.id,
      passengerName: `${user.name} ${user.surname}`,
      passengerAvatar: user.avatarUrl,
      passengerTelegram: user.telegramUsername,
      passengerPhone: user.phone,
      passengerDepartment: user.department,
      pickupSpot: finalPickupSpot,
      requestedSeats,
      hasLuggage: false,
      status: trip.approvalMode === 'auto' ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
    };

    StorageService.addRequest(newRequest);
    setRequests(StorageService.getRequests());

    if (trip.approvalMode === 'auto') {
      StorageService.updateRequestStatus(newRequest.id, 'approved');
      setRequests(StorageService.getRequests());
      setTrips(StorageService.getTrips());
      showToast(`✅ ${requestedSeats} місце(ця) на поїздку (${trip.departureTime}) підтверджено!`);
    } else {
      showToast(`📩 Заявку на ${requestedSeats} місць відправлено водію ${trip.driverName}!`);
    }

    setSelectedTripDetails(trip);
  };

  const handleApproveRequest = (requestId: string) => {
    triggerHaptic('medium');
    StorageService.updateRequestStatus(requestId, 'approved');
    setRequests(StorageService.getRequests());
    setTrips(StorageService.getTrips());
    showToast('✅ Заявку пасажира підтверджено!');
  };

  const handleRejectRequest = (requestId: string) => {
    triggerHaptic('medium');
    StorageService.updateRequestStatus(requestId, 'rejected');
    setRequests(StorageService.getRequests());
    showToast('❌ Заявку відхилено.');
  };

  const handleUpdateDriverStatus = (tripId: string, status: Trip['driverLiveStatus']) => {
    triggerHaptic('medium');
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      trip.driverLiveStatus = status;
      StorageService.updateTrip(trip);
      setTrips(StorageService.getTrips());
      showToast(`📍 Статус водія оновлено: ${status === 'departed' ? 'Ви вирушили!' : status === 'arrived' ? 'Ви на точці!' : 'Затримуюсь'}`);
    }
  };

  const handleUpdatePassengerStatus = (requestId: string, status: TripRequest['passengerLiveStatus']) => {
    triggerHaptic('medium');
    const req = requests.find(r => r.id === requestId);
    if (req) {
      req.passengerLiveStatus = status;
      const list = StorageService.getRequests();
      const idx = list.findIndex(r => r.id === requestId);
      if (idx !== -1) {
        list[idx] = req;
        localStorage.setItem('otp_carpool_requests', JSON.stringify(list));
        window.dispatchEvent(new Event('otp_storage_updated'));
        showToast('📍 Статус пасажира оновлено!');
      }
    }
  };

  const handleShareTrip = (trip: Trip) => {
    triggerHaptic('light');
    const text = `🚗 Поїздка з колегою (${trip.driverName}): ${trip.originDistrictName} ➡️ ${trip.destinationOfficeName} о ${trip.departureTime} (${trip.recurrence.label}).\nБронюйте у боті: https://t.me/OTPTravelHubbot`;
    try {
      navigator.clipboard.writeText(text);
      showToast('🔗 Посилання скопійовано! Поділіться ним у чаті колег.');
    } catch (e) {
      showToast('🚗 Посилання готова для чату Telegram!');
    }
  };

  // Filtering trips
  const filteredTrips = trips.filter(t => {
    if (selectedDistrictId && t.originDistrictId !== selectedDistrictId) return false;
    if (selectedTripType && t.tripType !== selectedTripType) return false;
    if (selectedRecurrence && t.recurrence.type !== selectedRecurrence) return false;
    return true;
  });

  const userDistrictObj = districts.find(d => d.id === user.districtId);
  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="app-container">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast-item">
            <CheckCircle2 size={20} color="var(--accent-green)" />
            <span style={{ flex: 1 }}>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top App Header */}
      <header className="top-bar">
        <div className="logo-group">
          <div className="logo-icon">OTP</div>
          <div className="brand-text">
            <h1>{settings.appName}</h1>
            <p>ГО Жилянська, 43</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Light / Dark Theme Switcher Button */}
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={isLightTheme ? 'Увімкнути Темну тему' : 'Увімкнути Світлу тему'}
          >
            {isLightTheme ? <Moon size={19} color="var(--accent-purple)" /> : <Sun size={19} color="var(--accent-warning)" />}
          </button>

          {/* Notifications Bell */}
          <button
            className="icon-btn"
            style={{ color: unreadNotifsCount > 0 ? 'var(--accent-green)' : 'var(--text-main)' }}
            onClick={() => {
              triggerHaptic('light');
              setIsNotificationsOpen(true);
            }}
            title="Сповіщення"
          >
            <Bell size={20} />
            {unreadNotifsCount > 0 && <span className="badge-dot" />}
          </button>

          {/* Telegram Bot Simulation launch button */}
          <button
            className="icon-btn"
            style={{ color: '#0088cc', borderColor: 'rgba(0,136,204,0.4)' }}
            onClick={() => {
              triggerHaptic('light');
              setIsTelegramModalOpen(true);
            }}
            title="Телеграм-бот"
          >
            <Bot size={20} />
          </button>

          {/* Admin Dashboard switch */}
          {user.isAdmin && (
            <button
              className="icon-btn"
              style={{ color: 'var(--accent-warning)', borderColor: 'rgba(245,158,11,0.4)' }}
              onClick={() => {
                triggerHaptic('light');
                setIsAdminModalOpen(true);
              }}
              title="Адмін Панель"
            >
              <Shield size={19} />
            </button>
          )}
        </div>
      </header>

      {/* Telegram Mini App Banner */}
      <div className="tg-banner">
        <div className="tg-badge">
          <Bot size={16} /> Telegram Mini App підключено
        </div>
        <button
          onClick={() => setIsTelegramModalOpen(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
        >
          @OTPTravelHubbot
        </button>
      </div>

      {/* Role Switcher Bar ( Driver vs Passenger Toggle ) */}
      <div className="role-switch-container">
        <button
          className={`role-btn ${roleMode === 'driver' ? 'active driver' : ''}`}
          onClick={() => handleRoleChange('driver')}
        >
          <Car size={18} /> Я сьогодні ВОДІЙ
        </button>
        <button
          className={`role-btn ${roleMode === 'passenger' ? 'active passenger' : ''}`}
          onClick={() => handleRoleChange('passenger')}
        >
          <User size={18} /> Я сьогодні ПАСАЖИР
        </button>
      </div>

      {/* Main Screen Content */}
      <main style={{ paddingBottom: '20px' }}>
        {/* Tab 1: HOME */}
        {activeTab === 'home' && (
          <div>
            <RoleSwitchBanner
              currentRole={roleMode}
              onSelectRole={handleRoleChange}
              onOpenCreateModal={() => {
                triggerHaptic('light');
                setIsCreateModalOpen(true);
              }}
              onOpenFilter={() => {
                triggerHaptic('light');
                setActiveTab('search');
              }}
              userDistrictName={userDistrictObj?.name}
            />

            {/* Quick District Filter component */}
            <TripFilter
              districts={districts}
              selectedDistrictId={selectedDistrictId}
              onSelectDistrict={setSelectedDistrictId}
              selectedTripType={selectedTripType}
              onSelectTripType={setSelectedTripType}
              selectedRecurrence={selectedRecurrence}
              onSelectRecurrence={setSelectedRecurrence}
              onReset={() => {
                setSelectedDistrictId('');
                setSelectedTripType('');
                setSelectedRecurrence('');
              }}
            />

            {/* Feed Section Title */}
            <div style={{ padding: '0 16px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="var(--accent-green)" />
                {roleMode === 'driver' ? 'Створені поїздки колег' : 'Доступні авто з районів'}
                <span className="badge badge-green" style={{ fontSize: '11px' }}>{filteredTrips.length}</span>
              </h3>

              <button
                onClick={handleManualSync}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Оновити поїздки з хмари"
              >
                <RefreshCw size={13} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                {isSyncing ? 'Оновлення...' : 'Оновити'}
              </button>
            </div>

            {/* Trip Cards Feed or Onboarding empty state */}
            {filteredTrips.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)', marginBottom: '12px' }}>
                  <Info size={24} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '6px' }}>
                  Вітаємо в корпоративному сервісі «Їдемо Разом»!
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.4' }}>
                  Поїздок за вибраним фільтром поки немає. Станьте першим, хто запропонує поїздку колегам до ГО Жилянська 43!
                </p>

                <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'left', fontSize: '12px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Як це працює:</div>
                  <div style={{ marginBottom: '6px' }}>1. 🚗 <strong>Якщо ви за кермом</strong> — опублікуйте графік «Через день» або вкажіть ваш час виїзду.</div>
                  <div style={{ marginBottom: '6px' }}>2. 🚶‍♂️ <strong>Якщо ви пасажир</strong> — забронюйте місце в авто колеги з вашого району.</div>
                  <div>3. 💬 <strong>Зв'язок у 1 клік</strong> — контакти та Telegram водія/пасажира відкриваються одразу.</div>
                </div>

                <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                  <PlusCircle size={18} /> Створити першу поїздку
                </button>
              </div>
            ) : (
              filteredTrips.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  userRequests={requests}
                  onBookSeat={handleOpenBookingModal}
                  onOpenDetails={(t) => setSelectedTripDetails(t)}
                  onShareTrip={handleShareTrip}
                  currentUserId={user.id}
                />
              ))
            )}
          </div>
        )}

        {/* Tab 2: SEARCH */}
        {activeTab === 'search' && (
          <div>
            <TripFilter
              districts={districts}
              selectedDistrictId={selectedDistrictId}
              onSelectDistrict={setSelectedDistrictId}
              selectedTripType={selectedTripType}
              onSelectTripType={setSelectedTripType}
              selectedRecurrence={selectedRecurrence}
              onSelectRecurrence={setSelectedRecurrence}
              onReset={() => {
                setSelectedDistrictId('');
                setSelectedTripType('');
                setSelectedRecurrence('');
              }}
            />

            <div style={{ padding: '0 16px', marginBottom: '8px', fontWeight: '700', fontSize: '14px', color: 'var(--text-muted)' }}>
              Результати пошуку ({filteredTrips.length})
            </div>

            {filteredTrips.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Нічого не знайдено за вказаними фільтрами.</p>
              </div>
            ) : (
              filteredTrips.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  userRequests={requests}
                  onBookSeat={handleOpenBookingModal}
                  onOpenDetails={(t) => setSelectedTripDetails(t)}
                  onShareTrip={handleShareTrip}
                  currentUserId={user.id}
                />
              ))
            )}
          </div>
        )}

        {/* Tab 3: MY TRIPS */}
        {activeTab === 'my_trips' && (
          <div>
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car color="var(--accent-green)" /> Мої створені поїздки (як Водій)
              </h3>
              {trips.filter(t => t.driverId === user.id).length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Ви ще не створювали поїздок.</p>
              ) : (
                trips.filter(t => t.driverId === user.id).map(trip => (
                  <div key={trip.id} style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '14px' }}>
                      <span>{trip.originDistrictName} ➡️ {trip.destinationOfficeName}</span>
                      <span style={{ color: 'var(--accent-green)' }}>{trip.departureTime}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {trip.recurrence.label} • {trip.availableSeats} вільних місць
                    </div>
                    <button className="btn btn-secondary" style={{ width: '100%', marginTop: '8px', fontSize: '12px', padding: '6px' }} onClick={() => setSelectedTripDetails(trip)}>
                      Керувати пасажирами
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User color="var(--accent-cyan)" /> Мої забронювання (як Пасажир)
              </h3>
              {requests.filter(r => r.passengerId === user.id).length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Ви не подавали заявок на поїздки.</p>
              ) : (
                requests.filter(r => r.passengerId === user.id).map(req => {
                  const targetTrip = trips.find(t => t.id === req.tripId);
                  return (
                    <div key={req.id} style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '14px' }}>
                        <span>{targetTrip?.originDistrictName || 'Поїздка'} ➡️ ГО Жилянська 43</span>
                        <span className={`badge ${req.status === 'approved' ? 'badge-green' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                          {req.status === 'approved' ? 'Підтверджено' : 'Очікує'}
                        </span>
                      </div>
                      {targetTrip && (
                        <button className="btn btn-secondary" style={{ width: '100%', marginTop: '8px', fontSize: '12px', padding: '6px' }} onClick={() => setSelectedTripDetails(targetTrip)}>
                          Переглянути стани та час
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 4: PROFILE */}
        {activeTab === 'profile' && (
          <ProfileTab
            user={user}
            vehicles={vehicles}
            districts={districts}
            onSaveProfile={(updated) => {
              StorageService.saveUser(updated);
              setUser(StorageService.getUser());
              showToast('Профіль успішно збережено!');
            }}
            onAddVehicle={(v) => {
              StorageService.addVehicle(v);
              setVehicles(StorageService.getVehicles());
              showToast('🚗 Автомобіль додано до гаража!');
            }}
            onDeleteVehicle={(id) => {
              StorageService.deleteVehicle(id);
              setVehicles(StorageService.getVehicles());
              showToast('Автомобіль видалено.');
            }}
            onResetAllData={() => {
              StorageService.resetAll();
              window.location.reload();
            }}
          />
        )}
      </main>

      {/* Bottom Telegram Mini App Navigation Bar */}
      <nav className="bottom-nav">
        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveTab('home'); }}>
          <Home size={20} />
          Головна
        </button>
        <button className={`nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveTab('search'); }}>
          <Search size={20} />
          Пошук
        </button>

        {/* Center Floating Create (+) Button */}
        <button className="nav-create-btn" onClick={() => { triggerHaptic('medium'); setIsCreateModalOpen(true); }} title="Створити поїздку">
          <PlusCircle size={26} />
        </button>

        <button className={`nav-item ${activeTab === 'my_trips' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveTab('my_trips'); }}>
          <Car size={20} />
          Мої поїздки
        </button>
        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveTab('profile'); }}>
          <User size={20} />
          Профіль
        </button>
      </nav>

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <div className="modal-overlay" onClick={() => setIsNotificationsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell color="var(--accent-green)" /> Сповіщення
              </h2>
              <button onClick={() => setIsNotificationsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {notifications.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>У вас немає нових сповіщень.</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ padding: '12px', background: n.isRead ? 'var(--bg-primary)' : 'rgba(16, 185, 129, 0.08)', borderLeft: n.isRead ? 'none' : '3px solid var(--accent-green)', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{n.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{n.message}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Booking Seat Modal */}
      <BookingModal
        isOpen={!!bookingTripTarget}
        onClose={() => setBookingTripTarget(null)}
        trip={bookingTripTarget}
        onConfirmBooking={handleConfirmBooking}
      />

      {/* Modals */}
      <TripFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTrip}
        districts={districts}
        offices={offices}
        vehicles={vehicles}
        currentUserId={user.id}
        currentUserName={`${user.name} ${user.surname}`}
        currentUserAvatar={user.avatarUrl}
        currentUserDepartment={user.department}
        currentUserTelegram={user.telegramUsername}
        currentUserPhone={user.phone}
      />

      <TripDetailsModal
        isOpen={!!selectedTripDetails}
        onClose={() => setSelectedTripDetails(null)}
        trip={selectedTripDetails}
        requests={requests}
        currentUserId={user.id}
        onApproveRequest={handleApproveRequest}
        onRejectRequest={handleRejectRequest}
        onUpdateDriverStatus={handleUpdateDriverStatus}
        onUpdatePassengerStatus={handleUpdatePassengerStatus}
        onDeleteTrip={(tripId) => {
          triggerHaptic('medium');
          StorageService.deleteTrip(tripId);
          setTrips(StorageService.getTrips());
          setRequests(StorageService.getRequests());
          showToast('Поїздку видалено.');
        }}
      />

      <TelegramBotModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        userName={`${user.name} ${user.surname}`}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        districts={districts}
        offices={offices}
        settings={settings}
        complaints={StorageService.getComplaints()}
        onAddDistrict={(d) => {
          StorageService.addDistrict(d);
          setDistricts(StorageService.getDistricts());
          showToast('Новий район додано!');
        }}
        onSaveSettings={(s) => {
          StorageService.saveSettings(s);
          setSettings(StorageService.getSettings());
          showToast('Налаштування збережено!');
        }}
      />
    </div>
  );
};

export default App;
