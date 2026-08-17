export interface GeoPoint {
  lat: number;
  lng: number;
}

// Координати офісів OTP Bank
export const OFFICE_COORDINATES: Record<string, GeoPoint> = {
  off_zhylianska: { lat: 50.4358, lng: 30.5052 }, // м. Київ, вул. Жилянська, 43
  off_fizkultury: { lat: 50.4285, lng: 30.5120 }, // вул. Фізкультури, 30
  off_vasylkivska: { lat: 50.4410, lng: 30.5200 }, // вул. Велика Васильківська, 5
};

// Центри районів Києва та передмістя
export const DISTRICT_COORDINATES: Record<string, GeoPoint> = {
  dist_troieshchyna: { lat: 50.5165, lng: 30.6033 },
  dist_obolon: { lat: 50.5015, lng: 30.4982 },
  dist_pozniaky: { lat: 50.3981, lng: 30.6344 },
  dist_osokorky: { lat: 50.3920, lng: 30.6150 },
  dist_vynohradar: { lat: 50.5083, lng: 30.4190 },
  dist_borshchahivka: { lat: 50.4288, lng: 30.3755 },
  dist_sofiivska: { lat: 50.4042, lng: 30.3392 },
  dist_vyshneve: { lat: 50.3883, lng: 30.3581 },
  dist_kryukivshchyna: { lat: 50.3688, lng: 30.3680 },
  dist_irpin: { lat: 50.5211, lng: 30.2508 },
  dist_bucha: { lat: 50.5480, lng: 30.2210 },
  dist_brovary: { lat: 50.5110, lng: 30.7900 },
  dist_akadem: { lat: 50.4650, lng: 30.3550 },
  dist_teremky: { lat: 50.3670, lng: 30.4540 },
  dist_solomianka: { lat: 50.4290, lng: 30.4780 },
};

// Координати популярних точок посадки
export const SPOT_COORDINATES: Record<string, GeoPoint> = {
  // Троєщина
  'ТРЦ Район': { lat: 50.5173, lng: 30.6080 },
  'вул. Закревського': { lat: 50.5120, lng: 30.6150 },
  'м. Чернігівська': { lat: 50.4599, lng: 30.6309 },
  'просп. Червоної Калини': { lat: 50.5140, lng: 30.5980 },

  // Оболонь
  'м. Мінська': { lat: 50.5123, lng: 30.4985 },
  'м. Оболонь': { lat: 50.5015, lng: 30.4982 },
  'ТРЦ Dream Yellow': { lat: 50.5065, lng: 30.4980 },
  'Оболонська Набережна': { lat: 50.4980, lng: 30.5250 },

  // Позняки
  'м. Позняки': { lat: 50.3981, lng: 30.6344 },
  'ТРЦ Piramida': { lat: 50.3965, lng: 30.6320 },
  'вул. Драгоманова': { lat: 50.4050, lng: 30.6360 },
  'вул. Анна Ахматової': { lat: 50.4020, lng: 30.6250 },

  // Осокорки
  'м. Осокорки': { lat: 50.3957, lng: 30.6158 },
  'ТЦ River Mall': { lat: 50.4030, lng: 30.6130 },
  'вул. Дніпровська набережна': { lat: 50.4070, lng: 30.5980 },

  // Виноградар
  'ТРЦ Retroville': { lat: 50.5050, lng: 30.4130 },
  'просп. Правди': { lat: 50.5080, lng: 30.4250 },
  'просп. Свободи': { lat: 50.5120, lng: 30.4180 },

  // Борщагівка
  'ТРЦ Квадрат': { lat: 50.4280, lng: 30.3750 },
  'вул. Гната Юри': { lat: 50.4300, lng: 30.3780 },
  'м. Святошин': { lat: 50.4578, lng: 30.3688 },

  // Софіївська Борщагівка
  'ЖК Софія': { lat: 50.4020, lng: 30.3420 },
  'ЖК Щасливий': { lat: 50.4080, lng: 30.3480 },
  'вул. Соборна': { lat: 50.4040, lng: 30.3390 },

  // Вишневе
  'Залізничний вокзал Вишневе': { lat: 50.3880, lng: 30.3600 },
  'вул. Європейська': { lat: 50.3910, lng: 30.3650 },
  'ЖК Акварелі': { lat: 50.3860, lng: 30.3550 },

  // Крюківщина
  'ЖК Євромісто': { lat: 50.3680, lng: 30.3680 },
  'вул. Бакинська': { lat: 50.3650, lng: 30.3720 },

  // Ірпінь
  'Центральний парк': { lat: 50.5150, lng: 30.2450 },
  'м. Академмістечко (зупинка)': { lat: 50.4650, lng: 30.3550 },
  'ЖК Синергія': { lat: 50.5250, lng: 30.2350 },

  // Буча
  'Новус Буча': { lat: 50.5480, lng: 30.2210 },
  'Центральний сквер': { lat: 50.5450, lng: 30.2150 },

  // Бровари
  'ТРЦ Термінал': { lat: 50.5150, lng: 30.7950 },
  'м. Лісова (посадка)': { lat: 50.4645, lng: 30.6450 },
  'вул. Незалежності': { lat: 50.5100, lng: 30.7850 },

  // Академмістечко
  'м. Академмістечко': { lat: 50.4650, lng: 30.3550 },
  'просп. Палладіна': { lat: 50.4680, lng: 30.3580 },

  // Теремки
  'м. Теремки': { lat: 50.3670, lng: 30.4540 },
  'м. Іподром': { lat: 50.3760, lng: 30.4680 },
  'ТРЦ Республіка Park': { lat: 50.3720, lng: 30.4580 },

  // Солом'янка
  'Солом\'янська площа': { lat: 50.4290, lng: 30.4780 },
  'Севастопольська площа': { lat: 50.4230, lng: 30.4580 },
  'м. Вокзальна': { lat: 50.4418, lng: 30.4883 },
};

export function getPickupCoordinates(districtId: string, spotName: string): GeoPoint {
  if (SPOT_COORDINATES[spotName]) {
    return SPOT_COORDINATES[spotName];
  }
  if (DISTRICT_COORDINATES[districtId]) {
    return DISTRICT_COORDINATES[districtId];
  }
  return { lat: 50.4501, lng: 30.5234 };
}

export function getDestinationCoordinates(officeId: string): GeoPoint {
  if (OFFICE_COORDINATES[officeId]) {
    return OFFICE_COORDINATES[officeId];
  }
  return { lat: 50.4358, lng: 30.5052 };
}
