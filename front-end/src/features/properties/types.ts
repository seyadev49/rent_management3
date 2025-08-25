// =======================================================================
// 📂 src/features/properties/types.ts
// Centralized type definitions for properties, units, and contracts.
// =======================================================================
export interface Property {
  id: number;
  name: string;
  type: string;
  address: string;
  city: string;
  subcity: string;
  woreda?: string;
  description?: string;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  created_at: string;
  amenities?: string[];
  units?: any[];
}

export interface Unit {
  id: number;
  unit_number: string;
  floor_number?: number;
  room_count?: number;
  monthly_rent: number;
  deposit: number;
  is_occupied: boolean;
  tenant_name?: string;
}

export interface Contract {
  id: number;
  tenant_name: string;
  property_name: string;
  unit_number: string;
  monthly_rent: number;
  status: string;
}

// A generic Tenant type for form selections
export interface Tenant {
    id: number;
    full_name: string;
}
