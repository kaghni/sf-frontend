import type { Metadata } from "next";
import { CalendarPlus, MapPin } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { listNearbyClusters } from "@/lib/meetups/api";
import { planMeetupAction } from "./actions";

export const metadata: Metadata = {
  title: "Meetups",
  description: "Bring together the contacts who live in the same city.",
};

export default async function MeetupsPage() {
  const clusters = await listNearbyClusters();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Meetups
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {clusters.length
            ? `${clusters.length} ${clusters.length === 1 ? "city" : "cities"} where several of your contacts live.`
            : "Cities where several of your contacts live will show up here."}
        </p>
      </header>

      {clusters.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clusters.map((cluster) => (
            <li
              key={cluster.city}
              className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-5"
            >
              <div>
                <h2 className="flex items-center gap-1.5 font-display text-lg font-semibold text-foreground">
                  <MapPin
                    className="h-4 w-4 text-primary"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  {cluster.city}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {cluster.contact_count} contacts nearby
                </p>
              </div>

              <form action={planMeetupAction.bind(null, cluster.city)}>
                <button type="submit" className={buttonClasses("primary")}>
                  <CalendarPlus
                    className="h-4 w-4"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Plan a meetup
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <MapPin
            className="mx-auto h-8 w-8 text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <h2 className="mt-4 font-display text-base font-semibold text-foreground">
            No one lives near each other yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Once two or more contacts share a city, you can plan a meetup for
            them here.
          </p>
        </div>
      )}
    </div>
  );
}
