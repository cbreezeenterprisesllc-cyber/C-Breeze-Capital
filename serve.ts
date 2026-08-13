// Production server for the built site. The TanStack Start build emits a portable
// fetch handler (dist/server/server.js) plus static client assets (dist/client);
// this wraps them in a Bun server on port 3000 — API routes first, then
// static files, then SSR for everything else.
//
// Starting a new instance supersedes the old one: it kills the previously
// recorded pid and takes over the port, so restarting never collides with the
// already-running server.
import handler from "./dist/server/server.js";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";
const CLIENT_DIR = `${import.meta.dir}/dist/client`;
const PID_FILE = "/tmp/team-site.pid";
// Canonical public port is 3000. The platform's boot-time backstop launches us with
// PORT=80 — that instance is SECONDARY: it never touches the pid file, so it can't
// kill the canonical server. Only the port-3000 instance enforces single-instance.
const IS_PRIMARY = PORT === 3000;

// PID file — single-instance enforcement for the primary. A new primary supersedes
// the old one so restarts (publish.sh / watchdog) never collide. Guard against pid
// reuse: only kill if the pid belongs to one of our server processes.
if (IS_PRIMARY) {
  try {
    const prev = Number(await Bun.file(PID_FILE).text().catch(() => ""));
    if (prev && prev !== process.pid && Number.isInteger(prev)) {
      const prevCmd = await Bun.file(`/proc/${prev}/cmdline`).text().catch(() => "");
      if (prevCmd.includes("serve.ts")) {
        try { process.kill(prev, "SIGTERM"); } catch { /* already gone */ }
        // Give the old process time to release the port before we bind it.
        await Bun.sleep(800);
      }
    }
    await Bun.write(PID_FILE, String(process.pid));
  } catch (e) {
    console.error("pid file warning:", e);
  }
  process.on("exit", () => {
    try { Bun.file(PID_FILE).unlink(); } catch { /* ignore */ }
  });
}

// Boot bootstrap: ensure the watchdog is running so the canonical port comes up even
// when the platform only starts us on port 80 (e.g. after a machine replacement).
// watchdog.sh self-detaches and no-ops if a watchdog is already alive.
try {
  const wd = Bun.spawn(["bash", `${import.meta.dir}/watchdog.sh`], {
    stdio: ["ignore", "ignore", "ignore"],
  });
  (wd as unknown as { unref?: () => void }).unref?.();
} catch { /* watchdog is best-effort */ }

// ── API route handlers ──────────────────────────────────────────────
async function handleApiRequest(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  const {
    handleHealth, handleRegister, handleLogin,
    handleListTenants, handleCreateTenant, handleGetTenant,
    handleListProducts, handleCreateProduct, handleGetProduct, handleUpdateProduct,
    handleListOrders, handleCreateOrder, handleGetOrder, handleUpdateOrderStatus,
    handleListCategories, handleCreateCategory, handleOrderStream,
    handleCreateCheckoutSession,
    handleDriverApply, handleDriverStatus,
    handleAdminListApplications, handleAdminGetApplication,
    handleAdminApproveApplication, handleAdminRejectApplication,
    handleAdminListDrivers, handleAdminSuspendDriver, handleDriverAvailability,
  } = await import("./src/lib/api-handlers.ts");

  let body: Record<string, unknown> = {};
  if ((method === "POST" || method === "PUT") && req.headers.get("content-type")?.includes("json")) {
    try { body = await req.json(); } catch { /* ignore */ }
  }

  // Match routes (order matters — specific before general)
  // Health
  if (method === "GET" && path === "/api/health") return handleHealth();

  // Auth
  if (method === "POST" && path === "/api/auth/register") return handleRegister(body);
  if (method === "POST" && path === "/api/auth/login") return handleLogin(body);

  // Tenants
  if (method === "GET" && path === "/api/tenants") return handleListTenants();
  if (method === "POST" && path === "/api/tenants") return handleCreateTenant(body);
  const tenantMatch = path.match(/^\/api\/tenants\/(.+)$/);
  if (method === "GET" && tenantMatch) return handleGetTenant(tenantMatch[1]);

  // Orders stream (before order/:id to avoid conflict)
  if (method === "GET" && path === "/api/orders/stream") return handleOrderStream(url);

  // Orders
  if (method === "GET" && path === "/api/orders") return handleListOrders(url);
  if (method === "POST" && path === "/api/orders") return handleCreateOrder(body);
  const orderStatusMatch = path.match(/^\/api\/orders\/([^/]+)\/status$/);
  if (method === "PUT" && orderStatusMatch) return handleUpdateOrderStatus(orderStatusMatch[1], body);
  const orderMatch = path.match(/^\/api\/orders\/([^/]+)$/);
  if (method === "GET" && orderMatch) return handleGetOrder(orderMatch[1]);

  // Products
  if (method === "GET" && path === "/api/products") return handleListProducts(url);
  if (method === "POST" && path === "/api/products") return handleCreateProduct(body);
  const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
  if (method === "GET" && productMatch) return handleGetProduct(productMatch[1]);
  if (method === "PUT" && productMatch) return handleUpdateProduct(productMatch[1], body);

  // Categories
  if (method === "GET" && path === "/api/categories") return handleListCategories(url);
  if (method === "POST" && path === "/api/categories") return handleCreateCategory(body);

  // Stripe Checkout
  if (method === "POST" && path === "/api/checkout") return await handleCreateCheckoutSession(body);

  // Driver Application
  if (method === "POST" && path === "/api/drivers/apply") return handleDriverApply(body);
  if (method === "GET" && path === "/api/drivers/status") return handleDriverStatus(url);

  // Admin — Driver Applications
  if (method === "GET" && path === "/api/admin/drivers/applications") return handleAdminListApplications(url);
  const appApproveMatch = path.match(/^\/api\/admin\/drivers\/applications\/([^/]+)\/approve$/);
  if (method === "PUT" && appApproveMatch) return handleAdminApproveApplication(appApproveMatch[1], body);
  const appRejectMatch = path.match(/^\/api\/admin\/drivers\/applications\/([^/]+)\/reject$/);
  if (method === "PUT" && appRejectMatch) return handleAdminRejectApplication(appRejectMatch[1], body);
  const appGetMatch = path.match(/^\/api\/admin\/drivers\/applications\/([^/]+)$/);
  if (method === "GET" && appGetMatch) return handleAdminGetApplication(appGetMatch[1]);

  // Admin — Drivers
  if (method === "GET" && path === "/api/admin/drivers") return handleAdminListDrivers();
  const driverSuspendMatch = path.match(/^\/api\/admin\/drivers\/([^/]+)\/suspend$/);
  if (method === "PUT" && driverSuspendMatch) return handleAdminSuspendDriver(driverSuspendMatch[1]);

  // Driver — Availability
  const driverAvailMatch = path.match(/^\/api\/drivers\/([^/]+)\/availability$/);
  if (method === "PUT" && driverAvailMatch) return handleDriverAvailability(driverAvailMatch[1], body);

  return null; // not an API route
}

Bun.serve({
  port: PORT,
  hostname: HOST,
  async fetch(req) {
    const url = new URL(req.url);

    // 1. Handle API routes
    if (url.pathname.startsWith("/api/")) {
      const apiResponse = await handleApiRequest(req);
      if (apiResponse) return apiResponse;
    }

    // 2. Serve static files from dist/client
    if (url.pathname !== "/") {
      const file = Bun.file(CLIENT_DIR + url.pathname);
      if (await file.exists()) {
        // Never let the service worker script or manifest be held in an HTTP
        // cache — browsers must see SW updates immediately so old cached
        // pages are purged on the next load.
        if (url.pathname === "/sw.js" || url.pathname === "/manifest.json") {
          return new Response(file, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
          });
        }
        return new Response(file);
      }
    }

    // 3. Fallthrough to TanStack SSR handler
    const ssrResponse = await (
      handler as { fetch: (r: Request) => Response | Promise<Response> }
    ).fetch(req);
    // HTML shell is dynamic (SSR) — never cache it, so users always get the
    // current site and the service worker picks up updates on next load.
    const headers = new Headers(ssrResponse.headers);
    if (!headers.has("Cache-Control")) {
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    }
    return new Response(ssrResponse.body, {
      status: ssrResponse.status,
      statusText: ssrResponse.statusText,
      headers,
    });
  },
});

console.log(`GreenExpress serving on http://${HOST}:${String(PORT)}`);