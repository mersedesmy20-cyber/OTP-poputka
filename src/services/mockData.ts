import type { District, Office, UserProfile, Vehicle, Trip, AppSettings, RouteSubscription, AppNotification } from '../types';

export const INITIAL_DISTRICTS: District[] = [
  { id: 'dist_troieshchyna', name: 'Троєщина', cityPart: 'Лівий берег', popularPickupSpots: ['ТРЦ Район', 'вул. Закревського', 'м. Чернігівська', 'просп. Червоної Калини'] },
  { id: 'dist_obolon', name: 'Оболонь', cityPart: 'Правий берег', popularPickupSpots: ['м. Мінська', 'м. Оболонь', 'ТРЦ Dream Yellow', 'Оболонська Набережна'] },
  { id: 'dist_pozniaky', name: 'Позняки', cityPart: 'Лівий берег', popularPickupSpots: ['м. Позняки', 'ТРЦ Piramida', 'вул. Драгоманова', 'вул. Анна Ахматової'] },
  { id: 'dist_osokorky', name: 'Осокорки', cityPart: 'Лівий берег', popularPickupSpots: ['м. Осокорки', 'ТЦ River Mall', 'вул. Дніпровська набережна'] },
  { id: 'dist_vynohradar', name: 'Виноградар', cityPart: 'Правий берег', popularPickupSpots: ['ТРЦ Retroville', 'просп. Правди', 'просп. Свободи'] },
  { id: 'dist_borshchahivka', name: 'Борщагівка', cityPart: 'Правий берег', popularPickupSpots: ['ТРЦ Квадрат', 'вул. Гната Юри', 'м. Святошин'] },
  { id: 'dist_sofiivska', name: 'Софіївська Борщагівка', cityPart: 'Передмістя', popularPickupSpots: ['ЖК Софія', 'ЖК Щасливий', 'вул. Соборна'] },
  { id: 'dist_vyshneve', name: 'Вишневе', cityPart: 'Передмістя', popularPickupSpots: ['Залізничний вокзал Вишневе', 'вул. Європейська', 'ЖК Акварелі'] },
  { id: 'dist_kryukivshchyna', name: 'Крюківщина', cityPart: 'Передмістя', popularPickupSpots: ['ЖК Євромісто', 'вул. Бакинська'] },
  { id: 'dist_irpin', name: 'Ірпінь', cityPart: 'Передмістя', popularPickupSpots: ['Центральний парк', 'м. Академмістечко (зупинка)', 'ЖК Синергія'] },
  { id: 'dist_bucha', name: 'Буча', cityPart: 'Передмістя', popularPickupSpots: ['Новус Буча', 'Центральний сквер'] },
  { id: 'dist_brovary', name: 'Бровари', cityPart: 'Передмістя', popularPickupSpots: ['ТРЦ Термінал', 'м. Лісова (посадка)', 'вул. Незалежності'] },
  { id: 'dist_akadem', name: 'Академмістечко', cityPart: 'Правий берег', popularPickupSpots: ['м. Академмістечко', 'просп. Палладіна'] },
  { id: 'dist_teremky', name: 'Теремки', cityPart: 'Правий берег', popularPickupSpots: ['м. Теремки', 'м. Іподром', 'ТРЦ Республіка Park'] },
  { id: 'dist_solomianka', name: 'Солом\'янка', cityPart: 'Правий берег', popularPickupSpots: ['Солом\'янська площа', 'Севастопольська площа', 'м. Вокзальна'] },
];

export const INITIAL_OFFICES: Office[] = [
  { id: 'off_zhylianska', name: 'ГО ОТПБанк (Головний офіс)', address: 'м. Київ, вул. Жилянська, 43', districtId: 'dist_solomianka', isMainHQ: true },
  { id: 'off_fizkultury', name: 'Офіс OTP (вул. Фізкультури)', address: 'м. Київ, вул. Фізкультури, 30', districtId: 'dist_solomianka', isMainHQ: false },
  { id: 'off_vasylkivska', name: 'Центральне відділення OTP', address: 'м. Київ, вул. Велика Васильківська, 5', districtId: 'dist_solomianka', isMainHQ: false },
];

export const INITIAL_USER: UserProfile = {
  id: 'usr_me',
  name: 'Співробітник',
  surname: 'ОТП Банк',
  email: 'employee@otpbank.com.ua',
  phone: '+380 67 000 0000',
  telegramUsername: '',
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

export const INITIAL_VEHICLES: Vehicle[] = [];

export const INITIAL_SETTINGS: AppSettings = {
  appName: 'OTP Попутник',
  companyName: 'ОТП Банк',
  allowedDomains: ['otpbank.com.ua', 'otp.ua'],
  mainOfficeAddress: 'м. Київ, вул. Жилянська, 43',
  supportTelegram: 'otp_carpool_support',
  autoApproveRequestsDefault: false,
};

export const INITIAL_TRIPS: Trip[] = [];
export const INITIAL_SUBSCRIPTIONS: RouteSubscription[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
