import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import Page from "../app/(unauthenticated)/auth/[path]/page";

test("Sign In Page", () => {
  const { container } = render(
    <Page params={Promise.resolve({ path: "sign-in" })} />
  );
  expect(container).toBeDefined();
});
