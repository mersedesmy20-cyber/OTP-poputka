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
        ready: () => void;
        expand: () => void;
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

const CLOUD_API_BASE = 'https://crudcrud.com/api/43553f7b70924dfda4d6f42e0aac2b8f';

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

function sanitizeTrip(t: any): Trip | null {
  if (!t || typeof t !== 'object' || !t.id) return null;
  return {
    id: String(t.id),
    driverId: t.driverId || 'usr_unknown',
    driverName: t.driverName || 'Співробітник',
    driverAvatar: t.driverAvatar || undefined,
    driverDepartment: t.driverDepartment || 'ОТП Банк',
    driverTelegram: t.driverTelegram || '',
    driverPhone: t.driverPhone || '',
    vehicleId: t.vehicleId || 'veh_default',
    vehicleInfo: t.vehicleInfo || 'Автомобіль',
    vehiclePlate: t.vehiclePlate || '',
    tripType: t.tripType || 'to_office',
    originDistrictId: t.originDistrictId || 'dist_troieshchyna',
    originDistrictName: t.originDistrictName || 'Київ',
    originSpot: t.originSpot || 'Точка посадки',
    destinationOfficeId: t.destinationOfficeId || 'off_zhylianska',
    destinationOfficeName: t.destinationOfficeName || 'ГО ОТПБанк',
    destinationAddress: t.destinationAddress || 'вул. Жилянська, 43',
    departureDate: t.departureDate || new Date().toISOString().split('T')[0],
    departureTime: t.departureTime || '08:00',
    recurrence: (t.recurrence && typeof t.recurrence === 'object' && t.recurrence.type) ? {
      type: t.recurrence.type,
      label: t.recurrence.label || 'Регулярно',
    } : { type: 'every_other_day', label: 'Через день' },
    availableSeats: typeof t.availableSeats === 'number' ? t.availableSeats : 3,
    initialSeats: typeof t.initialSeats === 'number' ? t.initialSeats : 4,
    approvalMode: t.approvalMode || 'manual',
    compensationType: t.compensationType || 'fixed_contribution',
    compensationAmount: t.compensationAmount,
    compensationNotes: t.compensationNotes || '',
    maxWaitMinutes: t.maxWaitMinutes || 5,
    luggageAllowed: !!t.luggageAllowed,
    childSeatAvailable: !!t.childSeatAvailable,
    petsAllowed: !!t.petsAllowed,
    comment: t.comment || '',
    status: t.status || 'PUBLISHED',
    stops: Array.isArray(t.stops) && t.stops.length > 0 ? t.stops.map((s: any, idx: number) => ({
      id: s?.id || `s_${idx}`,
      name: s?.name || 'Зупинка',
      estimatedTime: s?.estimatedTime || t.departureTime || '08:00',
      order: s?.order || idx + 1,
    })) : [
      { id: 's1', name: t.originSpot || 'Точка відправлення', estimatedTime: t.departureTime || '08:00', order: 1 },
      { id: 's2', name: t.destinationOfficeName || 'ГО ОТПБанк', estimatedTime: '08:35', order: 2 }
    ],
    createdAt: t.createdAt || new Date().toISOString(),
  };
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const [tripsRes, reqsRes, notifsRes] = await Promise.all([
        fetch(`${CLOUD_API_BASE}/trips`, { signal: controller.signal }).catch(() => null),
        fetch(`${CLOUD_API_BASE}/requests`, { signal: controller.signal }).catch(() => null),
        fetch(`${CLOUD_API_BASE}/notifications`, { signal: controller.signal }).catch(() => null)
      ]);

      clearTimeout(timeoutId);

      if (tripsRes && tripsRes.ok) {
        const rawCloudTrips: any[] = await tripsRes.json();
        const localTrips = this.getTrips();

        if (Array.isArray(rawCloudTrips)) {
          const sanitizedCloudTrips = rawCloudTrips
            .map(sanitizeTrip)
            .filter((t): t is Trip => t !== null && !['trip_1', 'trip_2', 'trip_3', 'trip_4_evening'].includes(t.id));

          const mergedMap = new Map<string, Trip>();
          sanitizedCloudTrips.forEach(t => mergedMap.set(t.id, t));
          localTrips.forEach(t => mergedMap.set(t.id, t));

          const finalMergedTrips = Array.from(mergedMap.values());
          setItem(KEYS.TRIPS, finalMergedTrips);
        }
      }

      if (reqsRes && reqsRes.ok) {
        const cloudRequests: TripRequest[] = await reqsRes.json();
        if (Array.isArray(cloudRequests)) {
          const localRequests = this.getRequests();
          const mergedReqMap = new Map<string, TripRequest>();

          // Merge: remote cloud requests take precedence for status updates
          localRequests.forEach(r => mergedReqMap.set(r.id, r));
          cloudRequests.forEach(r => mergedReqMap.set(r.id, r));

          setItem(KEYS.REQUESTS, Array.from(mergedReqMap.values()));
        }
      }

      if (notifsRes && notifsRes.ok) {
        const cloudNotifs: AppNotification[] = await notifsRes.json();
        if (Array.isArray(cloudNotifs)) {
          const currentUser = this.getUser();
          const myCloudNotifs = cloudNotifs.filter(n => n.userId === currentUser.id);

          const localNotifs = this.getNotifications();
          const mergedNotifMap = new Map<string, AppNotification>();
          localNotifs.forEach(n => mergedNotifMap.set(n.id, n));
          myCloudNotifs.forEach(n => mergedNotifMap.set(n.id, n));

          setItem(KEYS.NOTIFICATIONS, Array.from(mergedNotifMap.values()));
        }
      }
    } catch (e) {
      console.warn('Cloud sync timeout/offline, fallback to local storage', e);
    }
    return this.getTrips();
  },

  async syncTripToCloud(trip: Trip): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const cleanTrip = sanitizeTrip(trip);
      if (!cleanTrip) return;

      await fetch(`${CLOUD_API_BASE}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanTrip),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (e) {
      console.warn('Error pushing trip to cloud', e);
    }
  },

  async syncRequestToCloud(req: TripRequest): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      await fetch(`${CLOUD_API_BASE}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (e) {
      console.warn('Error pushing request to cloud', e);
    }
  },

  async syncNotificationToCloud(notif: AppNotification): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      await fetch(`${CLOUD_API_BASE}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notif),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (e) {
      console.warn('Error pushing notification to cloud', e);
    }
  },

  // Trips
  getTrips(): Trip[] {
    const rawList = getItem<any[]>(KEYS.TRIPS, []);
    if (!Array.isArray(rawList)) return [];

    return rawList
      .map(sanitizeTrip)
      .filter((t): t is Trip => t !== null && !['trip_1', 'trip_2', 'trip_3', 'trip_4_evening'].includes(t.id));
  },
  addTrip(trip: Trip): void {
    const cleanTrip = sanitizeTrip(trip);
    if (!cleanTrip) return;

    const list = this.getTrips();
    list.unshift(cleanTrip);
    setItem(KEYS.TRIPS, list);

    this.notifySubscribers(cleanTrip);
    this.syncTripToCloud(cleanTrip);
  },
  updateTrip(trip: Trip): void {
    const list = this.getTrips();
    const idx = list.findIndex(t => t.id === trip.id);
    if (idx !== -1) {
      list[idx] = trip;
      setItem(KEYS.TRIPS, list);
      this.syncTripToCloud(trip);
    }
  },
  deleteTrip(tripId: string): void {
    const list = this.getTrips().filter(t => t.id !== tripId);
    setItem(KEYS.TRIPS, list);

    // Also delete associated requests
    const reqs = this.getRequests().filter(r => r.tripId !== tripId);
    setItem(KEYS.REQUESTS, reqs);
  },
  clearAllTrips(): void {
    setItem(KEYS.TRIPS, []);
    setItem(KEYS.REQUESTS, []);
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

    this.syncRequestToCloud(req);
  },
  updateRequestStatus(requestId: string, status: TripRequest['status']): void {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (req) {
      req.status = status;
      setItem(KEYS.REQUESTS, requests);
      this.syncRequestToCloud(req);

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
    this.syncNotificationToCloud(notif);
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
    window.dispatchEvent(new Event('otp_storage_updated'));
  }
};
