// ─── DezenExpress V1 Types ────────────────────────────────────────────────────

export type UserRole = "customer" | "rider";
export type ServiceType = "ride" | "delivery";
export type VehicleType =
  | "bicycle"
  | "motorcycle"
  | "tricycle"
  | "car"
  | "van"
  | "truck";
export type RequestStatus =
  | "requested"
  | "riders_displayed"
  | "selected"
  | "accepted"
  | "payment_confirmed"
  | "arrived"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "trip_started"
  | "trip_completed"
  | "completed"
  | "cancelled"
  | "rejected";

export interface Location {
  address: string;
  lat?: number;
  lng?: number;
  lga?: string;
  state?: string;
}

export interface RiderProfile {
  id: string;
  name: string;
  photo?: string;
  vehicleType: VehicleType;
  vehiclePlate?: string;
  rating: number;
  totalTrips: number;
  isAvailable: boolean;
  operatingRules: OperatingRules;
  estimatedArrival?: number; // minutes
  distanceAway?: number; // km
  priceEstimate?: number; // NGN
}

export interface OperatingRules {
  serviceTypes: ServiceType[];
  vehicleType: VehicleType;
  operatingAreas: string[]; // LGAs or states
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  maxDistance?: number; // km
  acceptsFragile?: boolean;
  acceptsBulky?: boolean;
}

export interface ServiceRequest {
  id: string;
  type: ServiceType;
  status: RequestStatus;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone: string;
    photo?: string;
  };
  pickup: Location;
  destination: Location;
  distance?: number; // km
  estimatedDuration?: number; // minutes
  price: number; // NGN
  riderEarnings: number; // 85% of price
  platformFee: number; // 15% of price
  packageInfo?: {
    description?: string;
    weight?: string;
    instructions?: string;
  };
  rider?: RiderProfile;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  pickupOtp?: string;
  deliveryOtp?: string;
}

export interface WalletBalance {
  pending: number; // in escrow
  available: number; // can withdraw
  total: number;
}

export interface Transaction {
  id: string;
  requestId: string;
  type: ServiceType;
  amount: number;
  riderAmount: number;
  platformAmount: number;
  status: "pending" | "settled" | "withdrawn";
  date: string;
  description: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
export const VEHICLE_TYPES: {
  value: VehicleType;
  label: string;
  icon: string;
  desc: string;
  maxKg: string;
}[] = [
  {
    value: "bicycle",
    label: "Bicycle",
    icon: "🚲",
    desc: "Eco-friendly, short distances",
    maxKg: "5kg",
  },
  {
    value: "motorcycle",
    label: "Motorcycle",
    icon: "🏍",
    desc: "Fast, city deliveries",
    maxKg: "10kg",
  },
  {
    value: "tricycle",
    label: "Tricycle",
    icon: "🛺",
    desc: "Good for packages",
    maxKg: "15kg",
  },
  {
    value: "car",
    label: "Car",
    icon: "🚗",
    desc: "Comfortable rides & deliveries",
    maxKg: "25kg",
  },
  {
    value: "van",
    label: "Van",
    icon: "🚐",
    desc: "Larger packages",
    maxKg: "100kg",
  },
  {
    value: "truck",
    label: "Truck",
    icon: "🚛",
    desc: "Heavy or bulk deliveries",
    maxKg: "500kg",
  },
];

export const RIDER_PERCENTAGE = 0.85;
export const PLATFORM_PERCENTAGE = 0.15;

export const MOCK_RIDERS: RiderProfile[] = [
  {
    id: "r1",
    name: "Emeka Obi",
    vehicleType: "motorcycle",
    vehiclePlate: "LAG-234-KA",
    rating: 4.8,
    totalTrips: 312,
    isAvailable: true,
    estimatedArrival: 5,
    distanceAway: 1.2,
    priceEstimate: 1500,
    operatingRules: {
      serviceTypes: ["ride", "delivery"],
      vehicleType: "motorcycle",
      operatingAreas: ["Ikeja", "Yaba", "Surulere"],
      maxDistance: 20,
      availability: {
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        startTime: "07:00",
        endTime: "21:00",
      },
    },
  },
  {
    id: "r2",
    name: "Tunde Adeyemi",
    vehicleType: "car",
    vehiclePlate: "LAG-891-AB",
    rating: 4.6,
    totalTrips: 187,
    isAvailable: true,
    estimatedArrival: 8,
    distanceAway: 2.1,
    priceEstimate: 2200,
    operatingRules: {
      serviceTypes: ["ride", "delivery"],
      vehicleType: "car",
      operatingAreas: ["Ikeja", "Victoria Island", "Lekki"],
      maxDistance: 40,
      availability: {
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        startTime: "06:00",
        endTime: "22:00",
      },
    },
  },
  {
    id: "r3",
    name: "Chioma Nwosu",
    vehicleType: "bicycle",
    vehiclePlate: undefined,
    rating: 4.9,
    totalTrips: 89,
    isAvailable: true,
    estimatedArrival: 12,
    distanceAway: 0.8,
    priceEstimate: 800,
    operatingRules: {
      serviceTypes: ["delivery"],
      vehicleType: "bicycle",
      operatingAreas: ["Yaba", "Surulere", "Agege"],
      maxDistance: 5,
      availability: {
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        startTime: "08:00",
        endTime: "18:00",
      },
    },
  },
  {
    id: "r4",
    name: "Bello Musa",
    vehicleType: "van",
    vehiclePlate: "ABJ-445-XZ",
    rating: 4.7,
    totalTrips: 234,
    isAvailable: true,
    estimatedArrival: 15,
    distanceAway: 3.5,
    priceEstimate: 4500,
    operatingRules: {
      serviceTypes: ["delivery"],
      vehicleType: "van",
      operatingAreas: ["Ikeja", "Mushin", "Oshodi", "Agege"],
      maxDistance: 60,
      availability: {
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        startTime: "07:00",
        endTime: "20:00",
      },
      acceptsBulky: true,
    },
  },
];

export const MOCK_REQUESTS: ServiceRequest[] = [
  {
    id: "req1",
    type: "ride",
    status: "requested",
    customer: {
      id: "c1",
      name: "Sarah Johnson",
      email: "sarah@email.com",
      phone: "08012345678",
    },
    pickup: { address: "14 Allen Avenue, Ikeja", lga: "Ikeja", state: "Lagos" },
    destination: {
      address: "3 Broad Street, Lagos Island",
      lga: "Lagos Island",
      state: "Lagos",
    },
    distance: 12.5,
    estimatedDuration: 25,
    price: 2500,
    riderEarnings: 2125,
    platformFee: 375,
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: "req2",
    type: "delivery",
    status: "requested",
    customer: {
      id: "c2",
      name: "Adebayo Okafor",
      email: "adebayo@email.com",
      phone: "08098765432",
    },
    pickup: { address: "Balogun Market, Lagos Island" },
    destination: {
      address: "22 Ogba Road, Ikeja",
      lga: "Ikeja",
      state: "Lagos",
    },
    distance: 8.3,
    estimatedDuration: 18,
    price: 1800,
    riderEarnings: 1530,
    platformFee: 270,
    packageInfo: {
      description: "Clothes and accessories",
      weight: "2kg",
      instructions: "Handle with care",
    },
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
];

export const MOCK_WALLET: WalletBalance = {
  pending: 4250,
  available: 12750,
  total: 17000,
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    requestId: "req10",
    type: "ride",
    amount: 3000,
    riderAmount: 2550,
    platformAmount: 450,
    status: "settled",
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    description: "Ride — Ikeja to Lekki",
  },
  {
    id: "t2",
    requestId: "req11",
    type: "delivery",
    amount: 1500,
    riderAmount: 1275,
    platformAmount: 225,
    status: "settled",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    description: "Delivery — Yaba to Surulere",
  },
  {
    id: "t3",
    requestId: "req12",
    type: "ride",
    amount: 2200,
    riderAmount: 1870,
    platformAmount: 330,
    status: "pending",
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    description: "Ride — Victoria Island to Ikeja",
  },
  {
    id: "t4",
    requestId: "req13",
    type: "delivery",
    amount: 800,
    riderAmount: 680,
    platformAmount: 120,
    status: "withdrawn",
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    description: "Delivery — Agege to Ogba",
  },
];
