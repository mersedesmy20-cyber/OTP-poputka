export type UserRoleMode = 'driver' | 'passenger';

export interface UserProfile {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  telegramUsername?: string;
  department?: string;
  districtId: string;
  officeId: string;
  avatarUrl?: string;
  isConfirmed: boolean;
  completedTripsCount: number;
  cancelledTripsCount: number;
  noShowCount: number;
  preferredRoleMode: UserRoleMode;
  isAdmin?: boolean;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  color: string;
  plateNumber: string;
  seats: number;
  comment?: string;
  isDefault: boolean;
}

export interface District {
  id: string;
  name: string;
  cityPart: string;
  popularPickupSpots: string[];
}

export interface Office {
  id: string;
  name: string;
  address: string;
  districtId: string;
  isMainHQ: boolean;
}

export type RecurrenceType = 'single' | 'workdays' | 'every_other_day' | 'mon_wed_fri' | 'tue_thu' | 'custom_days';

export interface RecurrenceRule {
  type: RecurrenceType;
  endDate?: string; // YYYY-MM-DD
  customDays?: number[]; // 0 = Sun, 1 = Mon, ...
  label: string;
}

export type TripType = 'to_office' | 'from_office' | 'between_offices' | 'custom';
export type TripStatus = 'PUBLISHED' | 'CONFIRMED' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED_BY_DRIVER' | 'EXPIRED';

export interface TripStop {
  id: string;
  name: string;
  address?: string;
  estimatedTime?: string;
  order: number;
}

export type CompensationType = 'free' | 'fixed_contribution' | 'split_gas' | 'personal_agreement' | 'car_rotation';

export interface Trip {
  id: string;
  driverId: string;
  driverName: string;
  driverAvatar?: string;
  driverDepartment?: string;
  driverTelegram?: string;
  driverPhone?: string;
  vehicleId: string;
  vehicleInfo: string;
  vehiclePlate: string;
  tripType: TripType;
  originDistrictId: string;
  originDistrictName: string;
  originSpot: string;
  destinationOfficeId: string;
  destinationOfficeName: string;
  destinationAddress: string;
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // HH:mm
  recurrence: RecurrenceRule;
  availableSeats: number;
  initialSeats: number;
  approvalMode: 'auto' | 'manual';
  compensationType: CompensationType;
  compensationAmount?: number; // UAH
  compensationNotes?: string;
  maxWaitMinutes: number;
  luggageAllowed: boolean;
  childSeatAvailable: boolean;
  petsAllowed: boolean;
  comment?: string;
  status: TripStatus;
  stops: TripStop[];
  createdAt: string;
  updatedAt?: string;
  driverLiveStatus?: 'ready' | 'departed' | 'arrived' | 'delayed_10' | 'delayed_15';
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'no_show';

export interface TripRequest {
  id: string;
  tripId: string;
  passengerId: string;
  passengerName: string;
  passengerAvatar?: string;
  passengerTelegram?: string;
  passengerPhone?: string;
  passengerDepartment?: string;
  pickupSpot: string;
  requestedSeats: number;
  hasLuggage: boolean;
  comment?: string;
  status: RequestStatus;
  createdAt: string;
  passengerLiveStatus?: 'ready' | 'on_spot' | 'delayed_5' | 'delayed_10' | 'cancelled';
}

export interface RouteSubscription {
  id: string;
  userId: string;
  districtId: string;
  districtName: string;
  destinationOfficeId: string;
  destinationOfficeName: string;
  tripType: TripType;
  departureTimeRange: string;
  isActive: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'request_new' | 'request_approved' | 'request_rejected' | 'trip_started' | 'trip_arrived' | 'trip_cancelled' | 'subscription_match';
  tripId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Complaint {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  tripId?: string;
  category: 'no_show' | 'dangerous_driving' | 'inappropriate_behavior' | 'financial_dispute' | 'spam' | 'other';
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface AppSettings {
  appName: string;
  companyName: string;
  allowedDomains: string[];
  mainOfficeAddress: string;
  supportTelegram: string;
  autoApproveRequestsDefault: boolean;
}
