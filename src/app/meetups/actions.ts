"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, ApiUnreachableError } from "@/lib/apiClient";
import { apiErrorMessage } from "@/lib/contacts/api";
import { createMeetup } from "@/lib/meetups/api";
import type { Meetup } from "@/lib/meetups/types";

/** Mutations for the meetups UI. Every one of these runs only on the server. */

const UNREACHABLE =
  "Could not reach the Contacts API. Check that the backend is running.";

/**
 * The coming Friday at 18:00 UTC; a week out if today is Friday. UTC on
 * purpose: the event page labels times as UTC, so the default must be
 * computed in the same zone regardless of where the server runs.
 */
function nextFridayEvening(now = new Date()): Date {
  const daysAhead = (5 - now.getUTCDay() + 7) % 7 || 7;
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysAhead, 18),
  );
}

/**
 * Turn a city cluster into a meetup and open its event page.
 *
 * Bind the city at the call site — `planMeetupAction.bind(null, city)` — so
 * the form itself carries no editable payload. The form has no state hook to
 * hand a message back to, so API failures surface through the route's error
 * boundary instead.
 */
export async function planMeetupAction(city: string): Promise<void> {
  let meetup: Meetup;
  try {
    meetup = await createMeetup({
      title: `${city} contacts meetup`,
      city,
      starts_at: nextFridayEvening().toISOString(),
    });
  } catch (error) {
    if (error instanceof ApiUnreachableError) throw new Error(UNREACHABLE);
    if (error instanceof ApiError) {
      throw new Error(
        apiErrorMessage(error, "The meetup could not be created."),
      );
    }
    throw error;
  }

  revalidatePath("/meetups");
  // Outside the try/catch: redirect() signals by throwing.
  redirect(`/meetups/${meetup.id}`);
}
