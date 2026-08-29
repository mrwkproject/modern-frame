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
export type MediaCaptureMode = 'single' | 'booth3';
export type MediaAssetStatus = 'pending' | 'ready' | 'failed' | 'archived';
export type MediaVisibility = 'visible' | 'hidden';

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

type EventSettingsRow = {
  event_id: string;
  guest_uploads_enabled: boolean;
  gallery_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type MediaAssetRow = {
  id: string;
  event_id: string;
  guest_session_id: string | null;
  storage_path: string;
  media_type: 'photo';
  capture_mode: MediaCaptureMode;
  template_id: string;
  mime_type: 'image/jpeg';
  byte_size: number;
  width: number;
  height: number;
  status: MediaAssetStatus;
  visibility: MediaVisibility;
  created_at: string;
  updated_at: string;
  ready_at: string | null;
  upload_expires_at: string;
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
      event_settings: {
        Row: EventSettingsRow;
        Insert: Pick<EventSettingsRow, 'event_id'> &
          Partial<Omit<EventSettingsRow, 'event_id'>>;
        Update: Partial<
          Pick<EventSettingsRow, 'guest_uploads_enabled' | 'gallery_enabled'>
        >;
        Relationships: [];
      };
      media_assets: {
        Row: MediaAssetRow;
        Insert: Pick<
          MediaAssetRow,
          | 'event_id'
          | 'storage_path'
          | 'capture_mode'
          | 'template_id'
          | 'mime_type'
          | 'byte_size'
          | 'width'
          | 'height'
        > &
          Partial<
            Omit<
              MediaAssetRow,
              | 'event_id'
              | 'storage_path'
              | 'capture_mode'
              | 'template_id'
              | 'mime_type'
              | 'byte_size'
              | 'width'
              | 'height'
            >
          >;
        Update: Partial<
          Pick<
            MediaAssetRow,
            'status' | 'visibility' | 'ready_at' | 'deleted_at'
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
      create_media_upload_intent: {
        Args: {
          event_slug: string;
          guest_token_hash: string;
          requested_capture_mode: string;
          requested_template_id: string;
          requested_mime_type: string;
          requested_byte_size: number;
          requested_width: number;
          requested_height: number;
        };
        Returns: Array<{
          media_id: string;
          storage_path: string;
          upload_expires_at: string;
        }>;
      };
      resolve_media_finalize: {
        Args: {
          event_slug: string;
          guest_token_hash: string;
          requested_media_id: string;
        };
        Returns: Array<{
          media_id: string;
          storage_path: string;
          expected_byte_size: number;
          expected_mime_type: string;
        }>;
      };
      list_guest_gallery: {
        Args: {
          event_slug: string;
          guest_token_hash: string;
          cursor_created_at?: string | null;
          cursor_id?: string | null;
          page_size?: number;
        };
        Returns: Array<{
          id: string;
          storage_path: string;
          capture_mode: MediaCaptureMode;
          template_id: string;
          width: number;
          height: number;
          created_at: string;
        }>;
      };
      validate_guest_gallery_session: {
        Args: { event_slug: string; guest_token_hash: string };
        Returns: Array<{
          valid: boolean;
          event_status: EventStatus;
          guest_uploads_enabled: boolean;
          gallery_enabled: boolean;
        }>;
      };
    };
    Enums: {
      organization_role: OrganizationRole;
      event_status: EventStatus;
      event_type: EventType;
      guest_session_status: GuestSessionStatus;
      media_capture_mode: MediaCaptureMode;
      media_asset_status: MediaAssetStatus;
      media_visibility: MediaVisibility;
    };
    CompositeTypes: Record<string, never>;
  };
};
