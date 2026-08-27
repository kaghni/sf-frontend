import React from "react";
import { render } from "@testing-library/react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import { makeContact } from "../mocks/handlers";

const PHOTO = "data:image/jpeg;base64,dGlueS1mYWtlLWpwZWc=";

describe("ContactAvatar", () => {
  it("shows the initials bubble when there is no photo", () => {
    const { container } = render(<ContactAvatar contact={makeContact()} />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("AL");
  });

  it("shows the photo as a circular image when one is set", () => {
    const { container } = render(
      <ContactAvatar contact={makeContact({ photo: PHOTO })} />,
    );

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", PHOTO);
    expect(image).toHaveClass("rounded-full", "object-cover");
    expect(container.textContent).toBe("");
  });
});
