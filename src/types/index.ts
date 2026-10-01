export interface Contract {
  id?: string;
  // Customer Identification
  customer_name: string;
  address: string;
  community: string;
  gps_coordinates?: string;
  phone_number: string;
  phone_number_2?: string;
  id_type: string;
  id_number: string;
  email_address?: string;
  number_of_kits: number;

  // Offer
  selected_offer: string;

  // Preferences & Terms
  receive_info: string;
  electronic_invoice: string;

  // Administrative
  file_number?: string;
  agreement_date: string;
  orange_shop: string;
  agent_name: string;
  agent_contact: string;

  // Signatures
  customer_signature?: string;
  agent_signature?: string;

  status: 'pending' | 'synced' | 'draft';
  created_at?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: string;
  orange_shop?: string;
  status: 'active' | 'inactive';
  must_change_password?: boolean;
}