import type { NextConfig } from "next";
import dns from "node:dns";
import net from "node:net";
import { execFileSync } from "node:child_process";
import { resolveBuildCommit } from "./src/lib/build-info";

// The IPv6 route to Neon is unreliable on some networks and Node's fetch
// doesn't fall back to IPv4, so local dev queries can stall without this.
// The default 250ms per-address attempt window is also too tight when
// latency spikes.
dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamilyAttemptTimeout(2000);

// The commit this build came from, served by GET /api/version so
// scripts/check-deploy-drift.mjs can compare prod with main (DECISIONS
// 2026-10-10 deploy-gap follow-up). Falls back to VERCEL_GIT_COMMIT_SHA.
const buildCommit = resolveBuildCommit(
  () =>
    execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
  process.env,
);

const nextConfig: NextConfig = {
  env: { BUILD_COMMIT: buildCommit },
};

export default nextConfig;
