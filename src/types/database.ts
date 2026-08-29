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
    };
    Enums: {
      organization_role: OrganizationRole;
      event_status: EventStatus;
      event_type: EventType;
    };
    CompositeTypes: Record<string, never>;
  };
};
