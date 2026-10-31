// Runs once when a server instance starts. Load the Cloudflare Access key set
// up front so a bad CF_ACCESS_TEAM_DOMAIN / CF_ACCESS_AUD shows in the logs
// instead of looking exactly like "nobody is signed in".
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  const { checkAccessAtStartup } = await import("@/lib/access")
  await checkAccessAtStartup()
}
