export type UserRole = 'admin' | 'sentinel';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  created_at: string;
}

export interface Attendee {
  id: string;
  full_name: string;
  nic: string;
  phone: string;
  email: string;
  qr_token: string;
  qr_used: boolean;
  qr_used_at: string | null;
  qr_used_by: string | null;
  created_by: string | null;
  created_at: string;
  scanned_by_profile?: {
    full_name: string;
    email: string;
  };
}

export interface ScanResult {
  status: 'granted' | 'already_used' | 'invalid';
  attendee?: Attendee;
  message: string;
}
