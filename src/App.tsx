import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import type { UserProfile, UserRoleMode, Trip, TripRequest, Vehicle, District, Office, AppSettings } from './types';
import { RoleSwitchBanner } from './components/RoleSwitchBanner';
import { TripCard } from './components/trips/TripCard';
import { TripFilter } from './components/trips/TripFilter';
import { TripFormModal } from './components/trips/TripFormModal';
import { TripDetailsModal } from './components/trips/TripDetailsModal';
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
  Sparkles
} from 'lucide-react';
import './styles/theme.css';

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

  // UI Active Navigation & Modals State
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'my_trips' | 'profile'>('home');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState<Trip | null>(null);

  // Filters State
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedTripType, setSelectedTripType] = useState<string>('');
  const [selectedRecurrence, setSelectedRecurrence] = useState<string>('');

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
    };

    window.addEventListener('otp_storage_updated', handleStorageChange);
    return () => window.removeEventListener('otp_storage_updated', handleStorageChange);
  }, []);

  // Handlers
  const handleRoleChange = (newRole: UserRoleMode) => {
    setRoleMode(newRole);
    StorageService.setRoleMode(newRole);
  };

  const handleCreateTrip = (newTrip: Trip) => {
    StorageService.addTrip(newTrip);
    setTrips(StorageService.getTrips());
  };

  const handleBookSeat = (trip: Trip) => {
    const pickupSpot = trip.stops[0]?.name || trip.originSpot;
    const newRequest: TripRequest = {
      id: 'req_' + Date.now(),
      tripId: trip.id,
      passengerId: user.id,
      passengerName: `${user.name} ${user.surname}`,
      passengerAvatar: user.avatarUrl,
      passengerTelegram: user.telegramUsername,
      passengerPhone: user.phone,
      passengerDepartment: user.department,
      pickupSpot,
      requestedSeats: 1,
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
    }

    setSelectedTripDetails(trip);
  };

  const handleApproveRequest = (requestId: string) => {
    StorageService.updateRequestStatus(requestId, 'approved');
    setRequests(StorageService.getRequests());
    setTrips(StorageService.getTrips());
  };

  const handleRejectRequest = (requestId: string) => {
    StorageService.updateRequestStatus(requestId, 'rejected');
    setRequests(StorageService.getRequests());
  };

  const handleUpdateDriverStatus = (tripId: string, status: Trip['driverLiveStatus']) => {
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      trip.driverLiveStatus = status;
      StorageService.updateTrip(trip);
      setTrips(StorageService.getTrips());
    }
  };

  const handleUpdatePassengerStatus = (requestId: string, status: TripRequest['passengerLiveStatus']) => {
    const req = requests.find(r => r.id === requestId);
    if (req) {
      req.passengerLiveStatus = status;
      const list = StorageService.getRequests();
      const idx = list.findIndex(r => r.id === requestId);
      if (idx !== -1) {
        list[idx] = req;
        localStorage.setItem('otp_carpool_requests', JSON.stringify(list));
        window.dispatchEvent(new Event('otp_storage_updated'));
      }
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

  return (
    <div className="app-container">
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
          {/* Telegram Bot Simulation launch button */}
          <button
            className="icon-btn"
            style={{ color: '#0088cc', borderColor: 'rgba(0,136,204,0.4)' }}
            onClick={() => setIsTelegramModalOpen(true)}
            title="Телеграм-бот"
          >
            <Bot size={20} />
          </button>

          {/* Admin Dashboard switch */}
          {user.isAdmin && (
            <button
              className="icon-btn"
              style={{ color: 'var(--accent-warning)', borderColor: 'rgba(245,158,11,0.4)' }}
              onClick={() => setIsAdminModalOpen(true)}
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
          @otp_ride_bot
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
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onOpenFilter={() => setActiveTab('search')}
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
            </div>

            {/* Trip Cards Feed */}
            {filteredTrips.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '30px 16px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>
                  Поїздок за вибраними фільтрами поки немає.
                </p>
                <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                  <PlusCircle size={16} /> Створити першу поїздку
                </button>
              </div>
            ) : (
              filteredTrips.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  userRequests={requests}
                  onBookSeat={handleBookSeat}
                  onOpenDetails={(t) => setSelectedTripDetails(t)}
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

            {filteredTrips.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                userRequests={requests}
                onBookSeat={handleBookSeat}
                onOpenDetails={(t) => setSelectedTripDetails(t)}
                currentUserId={user.id}
              />
            ))}
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
            }}
            onAddVehicle={(v) => {
              StorageService.addVehicle(v);
              setVehicles(StorageService.getVehicles());
            }}
            onDeleteVehicle={(id) => {
              StorageService.deleteVehicle(id);
              setVehicles(StorageService.getVehicles());
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
        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={20} />
          Головна
        </button>
        <button className={`nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
          <Search size={20} />
          Пошук
        </button>

        {/* Center Floating Create (+) Button */}
        <button className="nav-create-btn" onClick={() => setIsCreateModalOpen(true)} title="Створити поїздку">
          <PlusCircle size={26} />
        </button>

        <button className={`nav-item ${activeTab === 'my_trips' ? 'active' : ''}`} onClick={() => setActiveTab('my_trips')}>
          <Car size={20} />
          Мої поїздки
        </button>
        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={20} />
          Профіль
        </button>
      </nav>

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
          StorageService.deleteTrip(tripId);
          setTrips(StorageService.getTrips());
          setRequests(StorageService.getRequests());
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
        }}
        onSaveSettings={(s) => {
          StorageService.saveSettings(s);
          setSettings(StorageService.getSettings());
        }}
      />
    </div>
  );
};

export default App;
