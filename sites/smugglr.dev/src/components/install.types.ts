/** One downloadable archive on a release. */
export interface InstallBuild {
  /** The architecture as a reader names it: "Apple silicon", "x86_64". */
  arch: string;
  /** The archive's file name on the release. */
  file: string;
}

/** A platform's archives, grouped for the reader. */
export interface InstallPlatform {
  os: string;
  builds: InstallBuild[];
}

/** What the Install component shows for one product's release. */
export interface InstallRelease {
  product: string;
  /** Without the leading v. */
  version: string;
  /** The one-line installer, exactly as Copy puts it on the clipboard. */
  command: string;
  /** Where the one-line installer puts the binary. */
  installs: string;
  /** What the installer does about PATH, finishing "puts the binary in <installs>, and ...". */
  path: string;
  /** The release page, where GitHub shows each archive's SHA-256. */
  release: string;
  /** The release's download base: the archive's file name follows it. */
  downloads: string;
  platforms: InstallPlatform[];
  /** The crate on crates.io, when the release is also published there. */
  cargo?: {
    /** The command, exactly as Copy puts it on the clipboard. */
    command: string;
    /** What it builds, finishing "The crate is on crates.io too: ...". */
    note: string;
  };
}
