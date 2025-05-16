// /types/user.ts
import { User as SupabaseUser } from "@supabase/supabase-js";

export interface Profile {
  id: string; // UUID, matches auth.users.id
  full_name?: string | null;
  avatar_url?: string | null;
  role: "customer" | "admin";
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// You can extend SupabaseUser if needed, or combine it with Profile
export interface AppUser extends SupabaseUser {
  profile?: Profile | null;
}

export interface Address {
  id: string; // UUID
  user_id: string; // UUID
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state_province_region: string;
  postal_code: string;
  country: string;
  address_type?: "shipping" | "billing" | null;
  is_default?: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

