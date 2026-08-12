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
  INITIAL_USER,
  INITIAL_VEHICLES,
  INITIAL_DISTRICTS,
  INITIAL_OFFICES,
  INITIAL_SETTINGS,
  INITIAL_TRIPS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_NOTIFICATIONS
} from './mockData';

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

// Helper for local storage parsing with default fallback
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
  // User Profile & Role Mode
  getUser(): UserProfile {
    return getItem<UserProfile>(KEYS.USER, INITIAL_USER);
  },
  saveUser(user: UserProfile): void {
    setItem(KEYS.USER, user);
  },

  getRoleMode(): UserRoleMode {
    return getItem<UserRoleMode>(KEYS.ROLE_MODE, INITIAL_USER.preferredRoleMode);
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

  // Trips
  getTrips(): Trip[] {
    return getItem<Trip[]>(KEYS.TRIPS, INITIAL_TRIPS);
  },
  addTrip(trip: Trip): void {
    const list = this.getTrips();
    list.unshift(trip);
    setItem(KEYS.TRIPS, list);

    // Auto notify subscribers matching this trip
    this.notifySubscribers(trip);
  },
  updateTrip(trip: Trip): void {
    const list = this.getTrips();
    const idx = list.findIndex(t => t.id === trip.id);
    if (idx !== -1) {
      list[idx] = trip;
      setItem(KEYS.TRIPS, list);
    }
  },

  // Requests
  getRequests(): TripRequest[] {
    return getItem<TripRequest[]>(KEYS.REQUESTS, []);
  },
  addRequest(req: TripRequest): void {
    const list = this.getRequests();
    list.unshift(req);
    setItem(KEYS.REQUESTS, list);

    // Trigger notification to driver
    const trip = this.getTrips().find(t => t.id === req.tripId);
    if (trip) {
      this.addNotification({
        id: 'notif_' + Date.now(),
        userId: trip.driverId,
        title: '📩 Нова заявка на поїздку!',
        message: `Колега ${req.passengerName} бажає забронювати ${req.requestedSeats} місце від точки: ${req.pickupSpot}`,
        type: 'request_new',
        tripId: trip.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  },
  updateRequestStatus(requestId: string, status: TripRequest['status']): void {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (req) {
      req.status = status;
      setItem(KEYS.REQUESTS, requests);

      const trip = this.getTrips().find(t => t.id === req.tripId);
      if (trip && status === 'approved') {
        // Decrease available seats
        trip.availableSeats = Math.max(0, trip.availableSeats - req.requestedSeats);
        if (trip.availableSeats === 0) {
          trip.status = 'FULL';
        }
        this.updateTrip(trip);

        // Notify passenger
        this.addNotification({
          id: 'notif_' + Date.now(),
          userId: req.passengerId,
          title: '🎉 Заявку підтверджено!',
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

  // Internal Subscribers notifier
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

  // Reset to initial mock state
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
