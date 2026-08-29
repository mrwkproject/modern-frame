export type OrganizationRole = 'owner' | 'admin' | 'member';
export type EventStatus = 'draft' | 'active' | 'ended' | 'archived';
export type EventType =
  | 'wedding'
  | 'birthday'
  | 'graduation'
  | 'corporate'
  | 'conference'
  | 'concert'
  | 'community'
  | 'brand_activation'
  | 'other';
export type GuestSessionStatus = 'active' | 'revoked';

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
};

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type OrganizationMemberRow = {
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  status: EventStatus;
  description: string | null;
  event_type: EventType;
  timezone: string;
  cover_image_path: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type GuestSessionRow = {
  id: string;
  event_id: string;
  token_hash: string;
  status: GuestSessionStatus;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  revoked_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Pick<ProfileRow, 'id'> & Partial<Omit<ProfileRow, 'id'>>;
        Update: Partial<Omit<ProfileRow, 'id'>>;
        Relationships: [];
      };
      organizations: {
        Row: OrganizationRow;
        Insert: Pick<OrganizationRow, 'name' | 'slug' | 'created_by'> &
          Partial<Omit<OrganizationRow, 'name' | 'slug' | 'created_by'>>;
        Update: Partial<Omit<OrganizationRow, 'id' | 'created_by'>>;
        Relationships: [];
      };
      organization_members: {
        Row: OrganizationMemberRow;
        Insert: Pick<OrganizationMemberRow, 'organization_id' | 'user_id'> &
          Partial<Pick<OrganizationMemberRow, 'role'>>;
        Update: Partial<Pick<OrganizationMemberRow, 'role'>>;
        Relationships: [];
      };
      events: {
        Row: EventRow;
        Insert: Pick<
          EventRow,
          'organization_id' | 'name' | 'slug' | 'created_by'
        > &
          Partial<
            Omit<EventRow, 'organization_id' | 'name' | 'slug' | 'created_by'>
          >;
        Update: Partial<
          Omit<EventRow, 'id' | 'organization_id' | 'created_by'>
        >;
        Relationships: [];
      };
      guest_sessions: {
        Row: GuestSessionRow;
        Insert: Pick<
          GuestSessionRow,
          'event_id' | 'token_hash' | 'expires_at'
        > &
          Partial<
            Omit<GuestSessionRow, 'event_id' | 'token_hash' | 'expires_at'>
          >;
        Update: Partial<
          Pick<
            GuestSessionRow,
            'status' | 'last_seen_at' | 'expires_at' | 'revoked_at'
          >
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_event_by_slug: {
        Args: { event_slug: string };
        Returns: Array<
          Pick<
            EventRow,
            | 'slug'
            | 'name'
            | 'description'
            | 'event_type'
            | 'starts_at'
            | 'ends_at'
            | 'timezone'
            | 'status'
          >
        >;
      };
      create_guest_session: {
        Args: { event_slug: string; guest_token_hash: string };
        Returns: Array<{ expires_at: string }>;
      };
      validate_guest_session: {
        Args: { event_slug: string; guest_token_hash: string };
        Returns: Array<{ valid: boolean; expires_at: string | null }>;
      };
    };
    Enums: {
      organization_role: OrganizationRole;
      event_status: EventStatus;
      event_type: EventType;
      guest_session_status: GuestSessionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
