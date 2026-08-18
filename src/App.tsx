import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import type { UserProfile, UserRoleMode, Trip, TripRequest, Vehicle, District, Office, AppSettings, AppNotification } from './types';
import { TripCard } from './components/trips/TripCard';
import { TripFilter } from './components/trips/TripFilter';
import { TripFormModal } from './components/trips/TripFormModal';
import { TripDetailsModal } from './components/trips/TripDetailsModal';
import { BookingModal } from './components/trips/BookingModal';
import { TelegramBotModal } from './components/telegram/TelegramBotModal';
import { AdminModal } from './components/admin/AdminModal';
import { ProfileTab } from './components/profile/ProfileTab';
import { TripMapView } from './components/map/TripMapView';

import {
  Home,
  Map,
  Search,
  PlusCircle,
  Car,
  User,
  Bot,
  Shield,
  Bell,
  CheckCircle2,
  X,
  Info,
  Sun,
  Moon,
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
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'search' | 'my_trips' | 'profile'>('home');
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
  const [, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'online' | 'syncing' | 'offline'>('online');

  const handleManualSync = async () => {
    setIsSyncing(true);
    triggerHaptic('light');
    const cloudTrips = await StorageService.syncFromCloud();
    setTrips(cloudTrips);
    setRequests(StorageService.getRequests());
    setNotifications(StorageService.getNotifications());
    setCloudStatus(StorageService.getCloudStatus());
    setIsSyncing(false);
    const status = StorageService.getCloudStatus();
    if (status === 'online') {
      showToast('🔄 Дані оновлено');
    } else {
      showToast('⚠️ Офлайн режим');
    }
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
    const lastApprovedReqIds = new Set<string>();
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let previousCloudStatus: 'online' | 'syncing' | 'offline' = 'online';

    const checkApprovalEvents = (reqList: TripRequest[]) => {
      const myApproved = reqList.filter(r => r.passengerId === user.id && r.status === 'approved');
      myApproved.forEach(r => {
        if (!lastApprovedReqIds.has(r.id)) {
          lastApprovedReqIds.add(r.id);
          try {
            window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
          } catch(e) {}
          showToast('🎉 Водій підтвердив ваше місце!');
        }
      });
    };

    const doSync = async () => {
      const cloudTrips = await StorageService.syncFromCloud();
      setTrips(cloudTrips);
      const reqs = StorageService.getRequests();
      setRequests(reqs);
      setNotifications(StorageService.getNotifications());
      const newStatus = StorageService.getCloudStatus();
      setCloudStatus(newStatus);
      checkApprovalEvents(reqs);

      if (previousCloudStatus === 'offline' && newStatus === 'online') {
        showToast('🟢 Підключено! Дані синхронізовано.');
      }
      previousCloudStatus = newStatus;

      const newInterval = StorageService.getCloudPollInterval();
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
      intervalId = setInterval(doSync, newInterval);
    };

    StorageService.syncFromCloud().then(cloudTrips => {
      setTrips(cloudTrips);
      const reqs = StorageService.getRequests();
      setRequests(reqs);
      setNotifications(StorageService.getNotifications());
      setCloudStatus(StorageService.getCloudStatus());
      reqs.filter(r => r.passengerId === user.id && r.status === 'approved').forEach(r => lastApprovedReqIds.add(r.id));

      const pollMs = StorageService.getCloudPollInterval();
      intervalId = setInterval(doSync, pollMs);
    });

    return () => {
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, [user.id]);

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
    setSelectedDistrictId('');
    setSelectedTripType('');
    setSelectedRecurrence('');
    setActiveTab('home');
    showToast('🎉 Поїздку опубліковано!');
  };

  const handleOpenBookingModal = (trip: Trip, isQuickBooking: boolean = false) => {
    triggerHaptic('light');
    const existingReq = requests.find(r => r.tripId === trip.id && r.passengerId === user.id);
    if (existingReq) {
      showToast('⚠️ Ви вже забронювали цю поїздку');
      setSelectedTripDetails(trip);
      return;
    }

    if (isQuickBooking) {
      const defaultSpot = trip.stops[0]?.name || trip.originSpot;
      handleConfirmBooking(trip, 1, defaultSpot);
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
      showToast(`✅ ${requestedSeats} місце підтверджено!`);
    } else {
      showToast(`📩 Заявку відправлено водію`);
    }

    setSelectedTripDetails(trip);
  };

  const handleApproveRequest = (requestId: string) => {
    triggerHaptic('medium');
    StorageService.updateRequestStatus(requestId, 'approved');
    setRequests(StorageService.getRequests());
    setTrips(StorageService.getTrips());
    showToast('✅ Заявку підтверджено!');
  };

  const handleRejectRequest = (requestId: string) => {
    triggerHaptic('medium');
    StorageService.updateRequestStatus(requestId, 'rejected');
    setRequests(StorageService.getRequests());
    showToast('❌ Заявку відхилено');
  };

  const handleCancelRequest = (requestId: string) => {
    triggerHaptic('medium');
    StorageService.cancelRequest(requestId);
    setRequests(StorageService.getRequests());
    setTrips(StorageService.getTrips());
    showToast('Бронювання скасовано');
  };

  const handleUpdateDriverStatus = (tripId: string, status: Trip['driverLiveStatus']) => {
    triggerHaptic('medium');
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      trip.driverLiveStatus = status;
      StorageService.updateTrip(trip);
      setTrips(StorageService.getTrips());
      showToast(`📍 Статус оновлено`);
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
        showToast('📍 Статус оновлено');
      }
    }
  };

  const handleShareTrip = (trip: Trip) => {
    triggerHaptic('light');
    const text = `🚗 Поїздка з колегою (${trip.driverName}): ${trip.originDistrictName} ➡️ ${trip.destinationOfficeName} о ${trip.departureTime} (${trip.recurrence.label}).\nБронюйте у боті: https://t.me/OTPTravelHubbot`;
    try {
      navigator.clipboard.writeText(text);
      showToast('🔗 Посилання скопійовано!');
    } catch (e) {
      showToast('🚗 Посилання готова!');
    }
  };

  // Filtering trips
  const filteredTrips = trips.filter(t => {
    if (!t || !t.id) return false;
    if (selectedDistrictId && t.originDistrictId !== selectedDistrictId) return false;
    if (selectedTripType && t.tripType !== selectedTripType) return false;
    if (selectedRecurrence && t.recurrence?.type !== selectedRecurrence) return false;
    return true;
  });

  const userDistrictObj = districts.find(d => d.id === user.districtId);
  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="app-container">
      {/* Toast */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast-item">
            <CheckCircle2 size={18} color="var(--accent-green)" />
            <span style={{ flex: 1 }}>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ===== MINIMAL HEADER ===== */}
      <header className="top-bar">
        <div className="logo-group">
          <div className="logo-icon">OTP</div>
          <div className="brand-text">
            <h1>Попутник</h1>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="icon-btn"
            style={{ color: unreadNotifsCount > 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}
            onClick={() => { triggerHaptic('light'); setIsNotificationsOpen(true); }}
          >
            <Bell size={18} />
            {unreadNotifsCount > 0 && <span className="badge-dot" />}
          </button>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main>
        {/* Tab: HOME */}
        {activeTab === 'home' && (
          <div>
            {/* Greeting */}
            <div className="greeting-block">
              <div className="greeting-text">Привіт, {user.name}! 👋</div>
              <div className="greeting-district">
                Район: <strong>{userDistrictObj?.name || 'Не вказано'}</strong>
              </div>
            </div>

            {/* Role Toggle */}
            <div className="role-switch-container">
              <button
                className={`role-btn ${roleMode === 'driver' ? 'active driver' : ''}`}
                onClick={() => handleRoleChange('driver')}
              >
                <Car size={18} /> Водій
              </button>
              <button
                className={`role-btn ${roleMode === 'passenger' ? 'active passenger' : ''}`}
                onClick={() => handleRoleChange('passenger')}
              >
                <User size={18} /> Пасажир
              </button>
            </div>

            {/* Search Bar Trigger (opens search tab) */}
            <div
              className="search-bar-trigger"
              onClick={() => { triggerHaptic('light'); setActiveTab('search'); }}
            >
              <Search size={18} color="var(--text-dim)" />
              <span>Пошук поїздки...</span>
            </div>

            {/* Section Header */}
            <div className="section-header">
              <span className="section-title">Поїздки</span>
              <span className="section-count">{trips.length}</span>
            </div>

            {/* Trip Cards Feed */}
            {trips.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Info size={28} />
                </div>
                <h3>Поки немає поїздок</h3>
                <p>Станьте першим — опублікуйте поїздку для колег!</p>
                <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                  <PlusCircle size={18} /> Створити поїздку
                </button>
              </div>
            ) : (
              trips.map(trip => (
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

        {/* Tab: MAP */}
        {activeTab === 'map' && (
          <TripMapView
            trips={trips}
            userRequests={requests}
            onOpenDetails={(t) => setSelectedTripDetails(t)}
            onBookSeat={handleOpenBookingModal}
            currentUserId={user.id}
            isLightTheme={isLightTheme}
          />
        )}

        {/* Tab: SEARCH */}
        {activeTab === 'search' && (
          <div>
            <div style={{ padding: '16px 16px 0' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>Пошук</h2>
            </div>

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

            {/* Map toggle in search */}
            <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
                Знайдено: {filteredTrips.length}
              </span>
              <button
                onClick={() => { triggerHaptic('light'); setActiveTab('map'); }}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Map size={13} /> На карті
              </button>
            </div>

            {filteredTrips.length === 0 ? (
              <div className="empty-state">
                <p style={{ color: 'var(--text-dim)' }}>Нічого не знайдено</p>
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

        {/* Tab: MY TRIPS */}
        {activeTab === 'my_trips' && (
          <div>
            <div style={{ padding: '16px 16px 0' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Мої поїздки</h2>
            </div>

            {/* As Driver */}
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-muted)' }}>
                Як водій
              </h3>
              {trips.filter(t => t.driverId === user.id).length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Немає створених поїздок</p>
              ) : (
                trips.filter(t => t.driverId === user.id).map(trip => (
                  <div key={trip.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px' }}>
                        {trip.originDistrictName} → {trip.destinationOfficeName}
                      </span>
                      <span style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '14px' }}>{trip.departureTime}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {trip.recurrence.label} · {trip.availableSeats} місць
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%', marginTop: '8px', fontSize: '12px', padding: '8px', minHeight: '36px' }}
                      onClick={() => setSelectedTripDetails(trip)}
                    >
                      Керувати
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* As Passenger */}
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-muted)' }}>
                Як пасажир
              </h3>
              {requests.filter(r => r.passengerId === user.id).length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Немає бронювань</p>
              ) : (
                requests.filter(r => r.passengerId === user.id).map(req => {
                  const targetTrip = trips.find(t => t.id === req.tripId);
                  return (
                    <div key={req.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px' }}>
                          {targetTrip?.originDistrictName || 'Поїздка'} → ГО
                        </span>
                        <span className={`badge ${req.status === 'approved' ? 'badge-green' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                          {req.status === 'approved' ? '✓' : '⏳'}
                        </span>
                      </div>
                      {targetTrip && (
                        <button
                          className="btn btn-secondary"
                          style={{ width: '100%', marginTop: '8px', fontSize: '12px', padding: '8px', minHeight: '36px' }}
                          onClick={() => setSelectedTripDetails(targetTrip)}
                        >
                          Деталі
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab: PROFILE */}
        {activeTab === 'profile' && (
          <div>
            <ProfileTab
              user={user}
              vehicles={vehicles}
              districts={districts}
              onSaveProfile={(updated) => {
                StorageService.saveUser(updated);
                setUser(StorageService.getUser());
                showToast('Профіль збережено!');
              }}
              onAddVehicle={(v) => {
                StorageService.addVehicle(v);
                setVehicles(StorageService.getVehicles());
                showToast('🚗 Авто додано!');
              }}
              onDeleteVehicle={(id) => {
                StorageService.deleteVehicle(id);
                setVehicles(StorageService.getVehicles());
                showToast('Авто видалено');
              }}
              onResetAllData={() => {
                StorageService.resetAll();
                window.location.reload();
              }}
            />

            {/* Settings moved to profile */}
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-muted)' }}>
                Налаштування
              </h3>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', marginBottom: '8px', justifyContent: 'flex-start', gap: '10px' }}
                onClick={toggleTheme}
              >
                {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
                {isLightTheme ? 'Темна тема' : 'Світла тема'}
              </button>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', marginBottom: '8px', justifyContent: 'flex-start', gap: '10px', color: '#0088cc' }}
                onClick={() => { triggerHaptic('light'); setIsTelegramModalOpen(true); }}
              >
                <Bot size={18} />
                Telegram бот
              </button>

              {user.isAdmin && (
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', color: 'var(--accent-warning)' }}
                  onClick={() => { triggerHaptic('light'); setIsAdminModalOpen(true); }}
                >
                  <Shield size={18} />
                  Адмін панель
                </button>
              )}

              <button
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '8px', justifyContent: 'flex-start', gap: '10px' }}
                onClick={handleManualSync}
              >
                🔄 Синхронізувати
                {cloudStatus === 'offline' && <span style={{ color: 'var(--accent-danger)', fontSize: '11px' }}>офлайн</span>}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ===== BOTTOM NAV (5 items, no map) ===== */}
      <nav className="bottom-nav">
        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveTab('home'); }}>
          <Home size={20} />
          <span>Головна</span>
        </button>

        <button className={`nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveTab('search'); }}>
          <Search size={20} />
          <span>Пошук</span>
        </button>

        <button className="nav-create-btn" onClick={() => { triggerHaptic('medium'); setIsCreateModalOpen(true); }}>
          <PlusCircle size={26} />
        </button>

        <button className={`nav-item ${activeTab === 'my_trips' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveTab('my_trips'); }}>
          <Car size={20} />
          <span>Поїздки</span>
        </button>

        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { triggerHaptic('light'); setActiveTab('profile'); }}>
          <User size={20} />
          <span>Профіль</span>
        </button>
      </nav>

      {/* ===== MODALS ===== */}

      {/* Notifications */}
      {isNotificationsOpen && (
        <div className="modal-overlay" onClick={() => setIsNotificationsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Сповіщення</h2>
              <button onClick={() => setIsNotificationsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {notifications.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>Немає сповіщень</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ padding: '12px', background: n.isRead ? 'var(--bg-primary)' : 'rgba(16, 185, 129, 0.08)', borderLeft: n.isRead ? 'none' : '3px solid var(--accent-green)', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{n.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{n.message}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <BookingModal
        isOpen={!!bookingTripTarget}
        onClose={() => setBookingTripTarget(null)}
        trip={bookingTripTarget}
        onConfirmBooking={handleConfirmBooking}
      />

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
        onCancelRequest={handleCancelRequest}
        onDeleteTrip={(tripId) => {
          triggerHaptic('medium');
          StorageService.deleteTrip(tripId);
          setTrips(StorageService.getTrips());
          setRequests(StorageService.getRequests());
          showToast('Поїздку видалено');
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
          showToast('Район додано!');
        }}
        onSaveSettings={(s) => {
          StorageService.saveSettings(s);
          setSettings(StorageService.getSettings());
          showToast('Збережено!');
        }}
      />
    </div>
  );
};

export default App;
