import { describe, expect, it } from "vitest";
import { tagFromUrl } from "../src/install/data";

const asked = "https://github.com/rafters-studio/smugglr/releases/latest";

describe("the latest release tag, read from the redirect's final URL", () => {
  it("takes the tag from .../releases/tag/vX.Y.Z", () => {
    expect(tagFromUrl("https://github.com/rafters-studio/smugglr/releases/tag/v0.6.4", asked)).toBe("v0.6.4");
  });

  it("fails, naming the URL, when the final URL is not a release tag", () => {
    expect(() => tagFromUrl("https://github.com/rafters-studio/smugglr/releases", asked)).toThrow(
      "https://github.com/rafters-studio/smugglr/releases",
    );
    expect(() => tagFromUrl("https://github.com/rafters-studio/smugglr/releases/tag/nightly", asked)).toThrow(asked);
  });
});
