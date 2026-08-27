import "server-only";

import { ApiError, apiJson } from "@/lib/apiClient";
import type { Meetup, MeetupInput, NearbyCluster } from "./types";

/**
 * Server-side data access for the Meetups API. Same rules as
 * `lib/contacts/api`: runs on the Next server only, so the backend URL stays
 * private and the browser never makes a cross-origin request.
 */

const MEETUPS_PATH = "/api/v1/meetups";

/** Cities with at least two contacts, most populous first. */
export async function listNearbyClusters(): Promise<NearbyCluster[]> {
  return apiJson<NearbyCluster[]>(`${MEETUPS_PATH}/nearby`, {
    cache: "no-store",
  });
}

/** Fetch one meetup, or `null` when the API reports 404. */
export async function getMeetup(id: number): Promise<Meetup | null> {
  try {
    return await apiJson<Meetup>(`${MEETUPS_PATH}/${id}`, {
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function createMeetup(input: MeetupInput): Promise<Meetup> {
  return apiJson<Meetup>(MEETUPS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
