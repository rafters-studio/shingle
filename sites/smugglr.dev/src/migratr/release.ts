import type { InstallRelease } from "@/components/install.types";

const version = "0.2.0";

/** migratr's current release, as its GitHub release page lists it. */
export const migratrRelease: InstallRelease = {
  product: "migratr",
  version,
  // smugglr.dev/migratr/install redirects to migratr's install.sh (public/_redirects).
  command: "curl -fsSL https://smugglr.dev/migratr/install | bash",
  path: "adds that directory to PATH in your shell’s config when it is not on it",
  installs: "~/.local/bin/migratr",
  release: `https://github.com/rafters-studio/migratr/releases/tag/v${version}`,
  downloads: `https://github.com/rafters-studio/migratr/releases/download/v${version}/`,
  platforms: [
    {
      os: "macOS",
      builds: [
        { arch: "Apple silicon", file: "migratr-macos-arm64.tar.gz" },
        { arch: "Intel", file: "migratr-macos-x64.tar.gz" },
      ],
    },
    { os: "Linux", builds: [{ arch: "x86_64", file: "migratr-linux-x64.tar.gz" }] },
    { os: "Windows", builds: [{ arch: "x86_64", file: "migratr-windows-x64.zip" }] },
  ],
};
