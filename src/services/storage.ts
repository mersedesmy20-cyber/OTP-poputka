import type {
  UserProfile,
  Vehicle,
  Trip,
  TripRequest,
  RouteSubscription,
  AppNotification,
  District,
  Office,
  AppSettings,
  UserRoleMode,
  Complaint
} from '../types';
import {
  INITIAL_VEHICLES,
  INITIAL_DISTRICTS,
  INITIAL_OFFICES,
  INITIAL_SETTINGS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_NOTIFICATIONS
} from './mockData';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

const KEYS = {
  USER: 'otp_carpool_user',
  ROLE_MODE: 'otp_carpool_role_mode',
  VEHICLES: 'otp_carpool_vehicles',
  TRIPS: 'otp_carpool_trips',
  REQUESTS: 'otp_carpool_requests',
  SUBSCRIPTIONS: 'otp_carpool_subscriptions',
  NOTIFICATIONS: 'otp_carpool_notifications',
  DISTRICTS: 'otp_carpool_districts',
  OFFICES: 'otp_carpool_offices',
  SETTINGS: 'otp_carpool_settings',
  COMPLAINTS: 'otp_carpool_complaints',
};

const CLOUD_API_URL = 'https://api.restful-api.dev/objects/ff8081819f7e10ae019ff4f6c9972f6c';

function getTelegramUser(): Partial<UserProfile> | null {
  try {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser) {
      return {
        id: 'tg_' + tgUser.id,
        name: tgUser.first_name || 'Співробітник',
        surname: tgUser.last_name || '',
        telegramUsername: tgUser.username || '',
        avatarUrl: tgUser.photo_url || undefined,
      };
    }
  } catch (e) {
    console.error('Error getting Telegram user', e);
  }
  return null;
}

const DEFAULT_FALLBACK_USER: UserProfile = {
  id: 'usr_me',
  name: 'Співробітник',
  surname: 'ОТП Банк',
  email: 'employee@otpbank.com.ua',
  phone: '+380 67 000 0000',
  telegramUsername: 'otp_colleague',
  department: 'ГО Жилянська 43',
  districtId: 'dist_troieshchyna',
  officeId: 'off_zhylianska',
  avatarUrl: undefined,
  isConfirmed: true,
  completedTripsCount: 0,
  cancelledTripsCount: 0,
  noShowCount: 0,
  preferredRoleMode: 'passenger',
  isAdmin: true,
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from storage`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('otp_storage_updated'));
  } catch (e) {
    console.error(`Error writing ${key} to storage`, e);
  }
}

export const StorageService = {
  getUser(): UserProfile {
    const storedUser = getItem<UserProfile>(KEYS.USER, DEFAULT_FALLBACK_USER);
    const tgData = getTelegramUser();

    if (tgData) {
      const mergedUser: UserProfile = {
        ...storedUser,
        id: tgData.id || storedUser.id,
        name: tgData.name || storedUser.name,
        surname: tgData.surname !== undefined ? tgData.surname : storedUser.surname,
        telegramUsername: tgData.telegramUsername || storedUser.telegramUsername,
        avatarUrl: tgData.avatarUrl || storedUser.avatarUrl,
      };
      return mergedUser;
    }

    return storedUser;
  },
  saveUser(user: UserProfile): void {
    setItem(KEYS.USER, user);
  },

  getRoleMode(): UserRoleMode {
    return getItem<UserRoleMode>(KEYS.ROLE_MODE, 'passenger');
  },
  setRoleMode(mode: UserRoleMode): void {
    setItem(KEYS.ROLE_MODE, mode);
    const user = this.getUser();
    user.preferredRoleMode = mode;
    this.saveUser(user);
  },

  // Vehicles
  getVehicles(): Vehicle[] {
    return getItem<Vehicle[]>(KEYS.VEHICLES, INITIAL_VEHICLES);
  },
  addVehicle(vehicle: Vehicle): void {
    const list = this.getVehicles();
    if (vehicle.isDefault) {
      list.forEach(v => v.isDefault = false);
    }
    list.unshift(vehicle);
    setItem(KEYS.VEHICLES, list);
  },
  deleteVehicle(id: string): void {
    const list = this.getVehicles().filter(v => v.id !== id);
    setItem(KEYS.VEHICLES, list);
  },

  // Districts & Offices
  getDistricts(): District[] {
    return getItem<District[]>(KEYS.DISTRICTS, INITIAL_DISTRICTS);
  },
  addDistrict(district: District): void {
    const list = this.getDistricts();
    list.push(district);
    setItem(KEYS.DISTRICTS, list);
  },
  getOffices(): Office[] {
    return getItem<Office[]>(KEYS.OFFICES, INITIAL_OFFICES);
  },
  addOffice(office: Office): void {
    const list = this.getOffices();
    list.push(office);
    setItem(KEYS.OFFICES, list);
  },

  // Global Cloud Sync Methods
  async syncFromCloud(): Promise<Trip[]> {
    try {
      const res = await fetch(CLOUD_API_URL);
      if (res.ok) {
        const json = await res.json();
        const cloudTrips: Trip[] = json?.data?.trips || [];
        const cloudRequests: TripRequest[] = json?.data?.requests || [];

        if (Array.isArray(cloudTrips)) {
          const filteredCloudTrips = cloudTrips.filter(t => !['trip_1', 'trip_2', 'trip_3', 'trip_4_evening'].includes(t.id));
          setItem(KEYS.TRIPS, filteredCloudTrips);
        }
        if (Array.isArray(cloudRequests)) {
          setItem(KEYS.REQUESTS, cloudRequests);
        }
      }
    } catch (e) {
      console.warn('Cloud sync offline fallback to local storage', e);
    }
    return this.getTrips();
  },

  async syncToCloud(): Promise<void> {
    try {
      const trips = this.getTrips();
      const requests = this.getRequests();
      await fetch(CLOUD_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'otp_trips',
          data: { trips, requests }
        })
      });
    } catch (e) {
      console.warn('Error pushing trips to cloud database', e);
    }
  },

  // Trips
  getTrips(): Trip[] {
    const list = getItem<Trip[]>(KEYS.TRIPS, []);
    return list.filter(t => !['trip_1', 'trip_2', 'trip_3', 'trip_4_evening'].includes(t.id));
  },
  addTrip(trip: Trip): void {
    const list = this.getTrips();
    list.unshift(trip);
    setItem(KEYS.TRIPS, list);

    this.notifySubscribers(trip);
    this.syncToCloud();
  },
  updateTrip(trip: Trip): void {
    const list = this.getTrips();
    const idx = list.findIndex(t => t.id === trip.id);
    if (idx !== -1) {
      list[idx] = trip;
      setItem(KEYS.TRIPS, list);
      this.syncToCloud();
    }
  },
  deleteTrip(tripId: string): void {
    const list = this.getTrips().filter(t => t.id !== tripId);
    setItem(KEYS.TRIPS, list);

    // Also delete associated requests
    const reqs = this.getRequests().filter(r => r.tripId !== tripId);
    setItem(KEYS.REQUESTS, reqs);
    this.syncToCloud();
  },
  clearAllTrips(): void {
    setItem(KEYS.TRIPS, []);
    setItem(KEYS.REQUESTS, []);
    this.syncToCloud();
  },

  // Requests
  getRequests(): TripRequest[] {
    return getItem<TripRequest[]>(KEYS.REQUESTS, []);
  },
  addRequest(req: TripRequest): void {
    const list = this.getRequests();
    list.unshift(req);
    setItem(KEYS.REQUESTS, list);

    const trip = this.getTrips().find(t => t.id === req.tripId);
    if (trip) {
      const tgNotice = req.passengerTelegram ? ` (@${req.passengerTelegram})` : '';
      this.addNotification({
        id: 'notif_' + Date.now(),
        userId: trip.driverId,
        title: '📩 Нове бронювання місця!',
        message: `Колега ${req.passengerName}${tgNotice} забронював(ла) ${req.requestedSeats} місце від точки: ${req.pickupSpot}`,
        type: 'request_new',
        tripId: trip.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    this.syncToCloud();
  },
  updateRequestStatus(requestId: string, status: TripRequest['status']): void {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (req) {
      req.status = status;
      setItem(KEYS.REQUESTS, requests);

      const trip = this.getTrips().find(t => t.id === req.tripId);
      if (trip && status === 'approved') {
        trip.availableSeats = Math.max(0, trip.availableSeats - req.requestedSeats);
        if (trip.availableSeats === 0) {
          trip.status = 'FULL';
        }
        this.updateTrip(trip);

        this.addNotification({
          id: 'notif_' + Date.now(),
          userId: req.passengerId,
          title: '🎉 Ваше місце підтверджено!',
          message: `Водій ${trip.driverName} підтвердив ваше місце на поїздку (${trip.departureTime}, ${trip.originDistrictName} -> ${trip.destinationOfficeName})`,
          type: 'request_approved',
          tripId: trip.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
      this.syncToCloud();
    }
  },

  // Subscriptions
  getSubscriptions(): RouteSubscription[] {
    return getItem<RouteSubscription[]>(KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
  },
  addSubscription(sub: RouteSubscription): void {
    const list = this.getSubscriptions();
    list.unshift(sub);
    setItem(KEYS.SUBSCRIPTIONS, list);
  },
  deleteSubscription(id: string): void {
    const list = this.getSubscriptions().filter(s => s.id !== id);
    setItem(KEYS.SUBSCRIPTIONS, list);
  },

  // Notifications
  getNotifications(): AppNotification[] {
    return getItem<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },
  addNotification(notif: AppNotification): void {
    const list = this.getNotifications();
    list.unshift(notif);
    setItem(KEYS.NOTIFICATIONS, list);
  },
  markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      setItem(KEYS.NOTIFICATIONS, list);
    }
  },

  // Complaints
  getComplaints(): Complaint[] {
    return getItem<Complaint[]>(KEYS.COMPLAINTS, []);
  },
  addComplaint(c: Complaint): void {
    const list = this.getComplaints();
    list.unshift(c);
    setItem(KEYS.COMPLAINTS, list);
  },

  // Settings
  getSettings(): AppSettings {
    return getItem<AppSettings>(KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  saveSettings(settings: AppSettings): void {
    setItem(KEYS.SETTINGS, settings);
  },

  notifySubscribers(trip: Trip): void {
    const subs = this.getSubscriptions();
    subs.forEach(sub => {
      if (sub.isActive && sub.districtId === trip.originDistrictId) {
        this.addNotification({
          id: 'notif_sub_' + Date.now(),
          userId: sub.userId,
          title: '🔔 Нова поїздка з вашого району!',
          message: `${trip.driverName} вирушає о ${trip.departureTime} з району ${trip.originDistrictName} до ${trip.destinationOfficeName}. (${trip.recurrence.label})`,
          type: 'subscription_match',
          tripId: trip.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    });
  },

  resetAll(): void {
    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem(KEYS.ROLE_MODE);
    localStorage.removeItem(KEYS.VEHICLES);
    localStorage.removeItem(KEYS.TRIPS);
    localStorage.removeItem(KEYS.REQUESTS);
    localStorage.removeItem(KEYS.SUBSCRIPTIONS);
    localStorage.removeItem(KEYS.NOTIFICATIONS);
    localStorage.removeItem(KEYS.DISTRICTS);
    localStorage.removeItem(KEYS.OFFICES);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.COMPLAINTS);
    this.syncToCloud();
    window.dispatchEvent(new Event('otp_storage_updated'));
  }
};
