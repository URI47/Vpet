export enum Species {
  Dog = 'dog',
  Cat = 'cat',
  Cattle = 'cattle',
  SheepGoat = 'sheep_goat',
  Horse = 'horse',
  Camel = 'camel',
  Bird = 'bird',
}

export type Sex = 'male' | 'female' | 'neutered_male' | 'spayed_female';

export type VisitStatus = 'waiting' | 'in_exam' | 'completed' | 'urgent';

export type AppointmentType = 'exam' | 'vaccination' | 'surgery' | 'follow_up' | 'farm_visit';

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface ClinicProfile {
  clinicName: string;
  doctorName: string;
  licenseNumber: string;
  phone: string;
  city: string;
}

export interface Patient {
  id: string;
  name: string;
  species: Species;
  breed: string;
  sex: Sex;
  ageText: string;
  weightKg: number;
  identifier: string; // Microchip or Ear Tag
  ownerName: string;
  ownerPhone: string;
  allergies: string;
  chronicNotes: string;
  createdAt: string;
}

export interface PrescriptionItem {
  id: string;
  drugName: string;
  doseMgKg?: number;
  calculatedAmount: string;
  route: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface VitalSigns {
  tempC?: number;
  heartRate?: number;
  respRate?: number;
  crtSec?: string;
  mucousMembrane?: string;
  dehydrationPct?: number;
  bcs?: number; // Body Condition Score 1-9 or 1-5
}

export interface SoapVisit {
  id: string;
  patientId: string;
  date: string;
  weightKg: number;
  vitals: VitalSigns;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  prescriptions: PrescriptionItem[];
  followUpDate?: string;
}

export interface VaccinationRecord {
  id: string;
  patientId: string;
  vaccineName: string;
  dateGiven: string;
  nextDueDate: string;
  batchNumber: string;
  notes?: string;
  completed?: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: AppointmentType;
  reason: string;
  status: AppointmentStatus;
  visitStatus?: VisitStatus;
  notes?: string;
}

export interface SpeciesDoseSpec {
  minMgKg: number;
  maxMgKg: number;
  defaultMgKg: number;
  routes: string[];
  frequency: string;
  notes?: string;
  meatWithdrawalDays?: number;
  milkWithdrawalDays?: number;
}

export interface DrugFormularyItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'antibiotic' | 'nsaid_pain' | 'antiparasitic' | 'anesthetic_sedative' | 'gi_antiemetic' | 'emergency_cardiac' | 'steroid';
  defaultConcentrationMgPerUnit: number;
  unitLabel: 'مل' | 'قرص';
  speciesDoses: Partial<Record<Species, SpeciesDoseSpec>>;
  contraindications: string;
}

export interface LabRange {
  parameter: string;
  unit: string;
  min: number;
  max: number;
}

export interface SpeciesPhysiology {
  species: Species;
  labelAr: string;
  tempMinC: number;
  tempMaxC: number;
  hrMin: number;
  hrMax: number;
  rrMin: number;
  rrMax: number;
  gestationDays: number;
  maintenanceFluidMlKgDay: number;
  rumenMotility?: string;
  labRanges: LabRange[];
}

export interface EmergencyProtocol {
  id: string;
  titleAr: string;
  category: 'poisoning' | 'metabolic' | 'acute';
  affectedSpecies: string;
  clinicalSigns: string[];
  antidoteOrFirstLine: string;
  dosageProtocol: string;
  criticalWarnings: string;
}

export type ActiveTab =
  | 'overview'
  | 'patients'
  | 'calculators'
  | 'schedule'
  | 'reference'
  | 'store';

export type UserRole = 'vet' | 'livestock_breeder' | 'pet_owner';

export interface UserAccount {
  id: string;
  role: UserRole;
  fullName: string;
  phone: string;
  city: string;
  password?: string;
  farmName?: string;
  herdTypes?: string;
  headCount?: number;
  createdAt: string;
}

export type StoreDepartment = 'pets' | 'farm';

export type StoreCategory =
  | 'nutrition'
  | 'care_hygiene'
  | 'equipment'
  | 'supplements';

export interface StoreProduct {
  id: string;
  nameAr: string;
  subtitleAr: string;
  department: StoreDepartment;
  category: StoreCategory;
  targetAnimals: string;
  priceSar: number;
  variants: string[];
  inStock: boolean;
  imageUrl: string;
  vetNote: string;
}

export interface CartItem {
  productId: string;
  variant: string;
  quantity: number;
}

export interface StoreOrder {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: 'delivery' | 'clinic_pickup';
  address: string;
  paymentMethod: 'cod' | 'card_on_delivery';
  items: {
    nameAr: string;
    variant: string;
    quantity: number;
    unitPriceSar: number;
  }[];
  totalSar: number;
  status: 'preparing' | 'shipped' | 'delivered';
}


