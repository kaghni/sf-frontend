import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import { api, makeMeetup } from "../../mocks/handlers";
import {
  createMeetup,
  getMeetup,
  listNearbyClusters,
} from "@/lib/meetups/api";
import type { MeetupInput } from "@/lib/meetups/types";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const INPUT: MeetupInput = {
  title: "Berlin contacts meetup",
  city: "Berlin",
  starts_at: "2026-08-28T16:00:00.000Z",
};

describe("listNearbyClusters", () => {
  it("returns the cities with several contacts", async () => {
    await expect(listNearbyClusters()).resolves.toEqual([
      { city: "San Francisco", contact_ids: [1, 2], contact_count: 2 },
    ]);
  });
});

describe("getMeetup", () => {
  it("returns null on 404 rather than throwing", async () => {
    await expect(getMeetup(4242)).resolves.toBeNull();
  });
});

describe("createMeetup", () => {
  it("posts the input and returns the stored meetup", async () => {
    let seen: unknown;
    server.use(
      http.post(api("/api/v1/meetups"), async ({ request }) => {
        seen = await request.json();
        return HttpResponse.json(makeMeetup({ ...INPUT, id: 7 }), {
          status: 201,
        });
      }),
    );

    await expect(createMeetup(INPUT)).resolves.toMatchObject({
      id: 7,
      city: "Berlin",
    });
    expect(seen).toEqual(INPUT);
  });
});
