import type { InstallRelease } from "@/components/install.types";

const version = "0.6.4";

/** smugglr's current release, as its GitHub release page lists it. */
export const smugglrRelease: InstallRelease = {
  product: "smugglr",
  version,
  // smugglr.dev/install redirects to smugglr's install.sh (public/_redirects).
  command: "curl -fsSL https://smugglr.dev/install | bash",
  path: "says how to add that directory to PATH when it is not on it",
  installs: "~/.local/bin/smugglr",
  release: `https://github.com/rafters-studio/smugglr/releases/tag/v${version}`,
  downloads: `https://github.com/rafters-studio/smugglr/releases/download/v${version}/`,
  platforms: [
    {
      os: "macOS",
      builds: [
        { arch: "Apple silicon", file: "smugglr-aarch64-apple-darwin.tar.gz" },
        { arch: "Intel", file: "smugglr-x86_64-apple-darwin.tar.gz" },
      ],
    },
    {
      os: "Linux",
      builds: [
        { arch: "x86_64", file: "smugglr-x86_64-unknown-linux-gnu.tar.gz" },
        { arch: "arm64", file: "smugglr-aarch64-unknown-linux-gnu.tar.gz" },
      ],
    },
    { os: "Windows", builds: [{ arch: "x86_64", file: "smugglr-x86_64-pc-windows-msvc.zip" }] },
  ],
};
