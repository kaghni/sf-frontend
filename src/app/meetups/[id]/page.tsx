import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronLeft, Mail } from "lucide-react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import { buttonClasses } from "@/components/ui/Button";
import { jobLine } from "@/lib/contacts/format";
import { getMeetup } from "@/lib/meetups/api";

type PageProps = { params: Promise<{ id: string }> };

function parseId(raw: string): number {
  const id = Number.parseInt(raw, 10);
  if (!Number.isInteger(id) || id < 1) notFound();
  return id;
}

// Pinned locale and zone, as in lib/contacts/format, so the server never
// renders a different string from the client.
const EVENT_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatEventDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${EVENT_DATE_FORMAT.format(date)} UTC`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const meetup = await getMeetup(parseId((await params).id));
  return {
    title: meetup?.title ?? "Meetup not found",
    description: meetup ? `${meetup.city} · ${formatEventDate(meetup.starts_at)}` : undefined,
  };
}

export default async function MeetupPage({ params }: PageProps) {
  const meetup = await getMeetup(parseId((await params).id));
  if (!meetup) notFound();

  const guestCount = meetup.guests.length;
  // Encode each address: "+" and other reserved characters are valid in
  // emails but would be mangled inside a query string.
  const inviteHref = `mailto:?bcc=${meetup.guests
    .map((guest) => encodeURIComponent(guest.email))
    .join(",")}&subject=${encodeURIComponent(meetup.title)}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link
        href="/meetups"
        className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        All meetups
      </Link>

      <header className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="bg-gradient-hero px-6 py-12 sm:px-10 sm:py-16">
          <p className="text-[13px] font-medium uppercase tracking-wide text-primary">
            Meetup
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {meetup.title}
          </h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays
                className="h-4 w-4 text-muted-foreground"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              {formatEventDate(meetup.starts_at)}
            </span>
            <span>📍 {meetup.city}</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Hosted by <span className="text-foreground">SF Contacts</span>
          </p>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card">
        <h2 className="border-b border-hairline px-4 py-3 text-[13px] font-medium text-foreground">
          Guests ({guestCount})
        </h2>
        {guestCount ? (
          <ul className="grid sm:grid-cols-2">
            {meetup.guests.map((guest) => {
              const subtitle = jobLine(guest);
              return (
                <li key={guest.id} className="border-b border-hairline last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
                  <Link
                    href={`/contacts/${guest.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/60"
                  >
                    <ContactAvatar contact={guest} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {guest.full_name}
                      </p>
                      {subtitle ? (
                        <p className="truncate text-[13px] text-muted-foreground">
                          {subtitle}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No contacts live in {meetup.city} right now.
          </p>
        )}
      </section>

      {guestCount ? (
        <div className="flex justify-end">
          <a href={inviteHref} className={buttonClasses("primary")}>
            <Mail className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Invite everyone
          </a>
        </div>
      ) : null}
    </div>
  );
}
