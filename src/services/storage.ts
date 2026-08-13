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

// ─── Local Storage Keys ───
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

// ─── Cloud: npoint.io — stable, permanent JSON bin ───
// Single atomic document: { trips: [], requests: [], notifications: [] }
const CLOUD_API_URL = 'https://api.npoint.io/38b2fa7106af5af737bc';

// ─── Circuit breaker state ───
let _cloudFailCount = 0;
let _cloudStatus: 'online' | 'syncing' | 'offline' = 'online';
const MAX_FAIL_BEFORE_BACKOFF = 3;

function getCloudPollInterval(): number {
  if (_cloudFailCount >= MAX_FAIL_BEFORE_BACKOFF) return 30000; // 30s when cloud is down
  if (_cloudFailCount >= 1) return 15000; // 15s after first fail
  return 6000; // 6s normal
}

// ─── Telegram User Detection ───
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

// ─── Local Storage Helpers ───
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

// ─── Data Sanitization ───
function sanitizeTrip(t: any): Trip | null {
  if (!t || typeof t !== 'object' || !t.id) return null;
  if (TEST_TRIP_IDS.includes(String(t.id))) return null;
  if (t.driverName && TEST_DRIVER_NAMES.includes(String(t.driverName).trim())) return null;
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
    updatedAt: t.updatedAt || t.createdAt || new Date().toISOString(),
  };
}

// ─── Smart Merge Helpers ───
// For trips: newer updatedAt wins
function mergeTrips(local: Trip[], cloud: Trip[]): Trip[] {
  const map = new Map<string, Trip>();

  // Cloud first
  cloud.forEach(t => map.set(t.id, t));

  // Local overrides ONLY if local is newer
  local.forEach(localTrip => {
    const existing = map.get(localTrip.id);
    if (!existing) {
      // Local-only trip (not yet in cloud) — keep it
      map.set(localTrip.id, localTrip);
    } else {
      // Both exist — keep the one with newer updatedAt
      const localTime = new Date(localTrip.updatedAt || localTrip.createdAt || 0).getTime();
      const cloudTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      if (localTime > cloudTime) {
        map.set(localTrip.id, localTrip);
      }
      // else: cloud version stays (it's newer — e.g. another device updated seats)
    }
  });

  return Array.from(map.values());
}

// For requests: cloud always wins for status changes (driver approved on their device)
function mergeRequests(local: TripRequest[], cloud: TripRequest[]): TripRequest[] {
  const map = new Map<string, TripRequest>();

  // Local first
  local.forEach(r => map.set(r.id, r));

  // Cloud OVERRIDES local — this is critical for approval status propagation
  cloud.forEach(r => map.set(r.id, r));

  return Array.from(map.values());
}

// For notifications: merge both, deduplicate by id
function mergeNotifications(local: AppNotification[], cloud: AppNotification[], userId: string): AppNotification[] {
  const map = new Map<string, AppNotification>();

  local.forEach(n => map.set(n.id, n));

  // Only merge cloud notifications that belong to this user
  cloud.filter(n => n.userId === userId).forEach(n => map.set(n.id, n));

  return Array.from(map.values());
}

// Filter out old test trip IDs and test driver names
const TEST_TRIP_IDS = [
  'trip_1', 'trip_2', 'trip_3', 'trip_4_evening',
  't1', 't2', 't3', 't4', 't_test',
  'mock_1', 'mock_2', 'mock_3', 'demo_1', 'demo_2'
];

const TEST_DRIVER_NAMES = [
  'Олена Шевченко',
  'Олександр Коваль',
  'Сергій Романенко',
  'Дмитро Мельник',
  'Анна Ткаченко',
  'Тест',
  'Тестовий Водій'
];

// ─── Main Storage Service ───
export const StorageService = {
  // ── Cloud Status ──
  getCloudStatus(): 'online' | 'syncing' | 'offline' {
    return _cloudStatus;
  },

  getCloudPollInterval(): number {
    return getCloudPollInterval();
  },

  // ── User ──
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

  // ── Role ──
  getRoleMode(): UserRoleMode {
    return getItem<UserRoleMode>(KEYS.ROLE_MODE, 'passenger');
  },
  setRoleMode(mode: UserRoleMode): void {
    setItem(KEYS.ROLE_MODE, mode);
    const user = this.getUser();
    user.preferredRoleMode = mode;
    this.saveUser(user);
  },

  // ── Vehicles ──
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

  // ── Districts & Offices ──
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

  // ════════════════════════════════════════════
  //  CLOUD SYNC — Atomic Single-Document Model
  // ════════════════════════════════════════════

  /**
   * Download the full cloud document and smart-merge with local data.
   * Cloud wins for request statuses (approvals), local wins for brand-new trips.
   */
  async syncFromCloud(): Promise<Trip[]> {
    _cloudStatus = 'syncing';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(CLOUD_API_URL, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Cloud returned ${res.status}`);
      }

      const cloudDoc = await res.json();

      // ── Merge Trips ──
      const rawCloudTrips: any[] = cloudDoc?.trips || [];
      const cloudTrips = rawCloudTrips
        .map(sanitizeTrip)
        .filter((t): t is Trip => t !== null && !TEST_TRIP_IDS.includes(t.id));

      const localTrips = this.getTrips();
      const mergedTrips = mergeTrips(localTrips, cloudTrips);
      setItem(KEYS.TRIPS, mergedTrips);

      // ── Merge Requests (cloud wins for status!) ──
      const cloudRequests: TripRequest[] = cloudDoc?.requests || [];
      if (Array.isArray(cloudRequests)) {
        const localRequests = this.getRequests();
        const mergedRequests = mergeRequests(localRequests, cloudRequests);
        setItem(KEYS.REQUESTS, mergedRequests);
      }

      // ── Merge Notifications ──
      const cloudNotifs: AppNotification[] = cloudDoc?.notifications || [];
      if (Array.isArray(cloudNotifs)) {
        const currentUser = this.getUser();
        const localNotifs = this.getNotifications();
        const mergedNotifs = mergeNotifications(localNotifs, cloudNotifs, currentUser.id);
        setItem(KEYS.NOTIFICATIONS, mergedNotifs);
      }

      // ── Circuit breaker: reset on success ──
      _cloudFailCount = 0;
      _cloudStatus = 'online';

    } catch (e) {
      _cloudFailCount++;
      _cloudStatus = 'offline';
      console.warn(`Cloud sync failed (attempt ${_cloudFailCount}, next poll in ${getCloudPollInterval() / 1000}s)`, e);
    }

    return this.getTrips();
  },

  /**
   * Upload the full local state as a single atomic JSON document.
   * This replaces the entire cloud document — no duplicates possible.
   */
  async syncToCloud(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const trips = this.getTrips();
      const requests = this.getRequests();
      const notifications = this.getNotifications();

      const res = await fetch(CLOUD_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trips, requests, notifications }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        _cloudFailCount = 0;
        _cloudStatus = 'online';
      } else {
        throw new Error(`Cloud POST returned ${res.status}`);
      }
    } catch (e) {
      _cloudFailCount++;
      _cloudStatus = 'offline';
      console.warn('Error pushing data to cloud', e);
    }
  },

  // ════════════════════════
  //  TRIPS
  // ════════════════════════
  getTrips(): Trip[] {
    const rawList = getItem<any[]>(KEYS.TRIPS, []);
    if (!Array.isArray(rawList)) return [];

    return rawList
      .map(sanitizeTrip)
      .filter((t): t is Trip => t !== null && !TEST_TRIP_IDS.includes(t.id));
  },

  addTrip(trip: Trip): void {
    const now = new Date().toISOString();
    const cleanTrip = sanitizeTrip({ ...trip, updatedAt: now });
    if (!cleanTrip) return;

    const list = this.getTrips();
    list.unshift(cleanTrip);
    setItem(KEYS.TRIPS, list);

    this.notifySubscribers(cleanTrip);
    this.syncToCloud();
  },

  updateTrip(trip: Trip): void {
    const now = new Date().toISOString();
    const list = this.getTrips();
    const idx = list.findIndex(t => t.id === trip.id);
    if (idx !== -1) {
      list[idx] = { ...trip, updatedAt: now };
      setItem(KEYS.TRIPS, list);
      this.syncToCloud();
    }
  },

  deleteTrip(tripId: string): void {
    const list = this.getTrips().filter(t => t.id !== tripId);
    setItem(KEYS.TRIPS, list);

    const reqs = this.getRequests().filter(r => r.tripId !== tripId);
    setItem(KEYS.REQUESTS, reqs);

    this.syncToCloud();
  },

  clearAllTrips(): void {
    setItem(KEYS.TRIPS, []);
    setItem(KEYS.REQUESTS, []);
    this.syncToCloud();
  },

  // ════════════════════════
  //  REQUESTS
  // ════════════════════════
  getRequests(): TripRequest[] {
    return getItem<TripRequest[]>(KEYS.REQUESTS, []);
  },

  addRequest(req: TripRequest): void {
    const list = this.getRequests();
    list.unshift(req);
    setItem(KEYS.REQUESTS, list);

    // Notify the driver
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

        // This notification will be synced to cloud and delivered to passenger's device
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

      // Push updated status to cloud immediately so other device sees it
      this.syncToCloud();
    }
  },

  // ════════════════════════
  //  SUBSCRIPTIONS
  // ════════════════════════
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

  // ════════════════════════
  //  NOTIFICATIONS
  // ════════════════════════
  getNotifications(): AppNotification[] {
    return getItem<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },
  addNotification(notif: AppNotification): void {
    const list = this.getNotifications();
    list.unshift(notif);
    setItem(KEYS.NOTIFICATIONS, list);
    // Note: syncToCloud() is called by the parent operation (addRequest/updateRequestStatus)
  },
  markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      setItem(KEYS.NOTIFICATIONS, list);
    }
  },

  // ════════════════════════
  //  COMPLAINTS
  // ════════════════════════
  getComplaints(): Complaint[] {
    return getItem<Complaint[]>(KEYS.COMPLAINTS, []);
  },
  addComplaint(c: Complaint): void {
    const list = this.getComplaints();
    list.unshift(c);
    setItem(KEYS.COMPLAINTS, list);
  },

  // ════════════════════════
  //  SETTINGS
  // ════════════════════════
  getSettings(): AppSettings {
    return getItem<AppSettings>(KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  saveSettings(settings: AppSettings): void {
    setItem(KEYS.SETTINGS, settings);
  },

  // ════════════════════════
  //  SUBSCRIBER NOTIFICATIONS
  // ════════════════════════
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

  // ════════════════════════
  //  RESET
  // ════════════════════════
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
