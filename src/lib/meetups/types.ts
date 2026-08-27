import type { Contact } from "@/lib/contacts/types";

/**
 * Types for the Meetups API (`/api/v1/meetups`). Field names stay snake_case so
 * payloads map 1:1 onto the wire format, as in `lib/contacts/types`.
 */

/** `GET /meetups/nearby` — a city where at least two contacts live. */
export interface NearbyCluster {
  city: string;
  contact_ids: number[];
  contact_count: number;
}

/** `MeetupCreate` — the body of `POST /meetups`. */
export interface MeetupInput {
  title: string;
  city: string;
  /** ISO 8601 */
  starts_at: string;
}

/** `MeetupRead` — a stored meetup with its guest list expanded. */
export interface Meetup extends MeetupInput {
  id: number;
  created_at: string;
  guests: Contact[];
}
