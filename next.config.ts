import type { NextConfig } from "next";
import dns from "node:dns";
import net from "node:net";

// The IPv6 route to Neon is unreliable on some networks and Node's fetch
// doesn't fall back to IPv4, so local dev queries can stall without this.
// The default 250ms per-address attempt window is also too tight when
// latency spikes.
dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamilyAttemptTimeout(2000);

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
