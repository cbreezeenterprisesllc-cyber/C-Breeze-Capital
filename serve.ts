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

// PID file management — disabled to avoid permission issues on restart
// const prev = Number(await Bun.file(PID_FILE).text().catch(() => ""));
// if (prev && prev !== process.pid) {
//   try { process.kill(prev); } catch { /* already gone */ }
//   await Bun.sleep(500);
// }
// await Bun.write(PID_FILE, String(process.pid));

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
      if (await file.exists()) return new Response(file);
    }

    // 3. Fallthrough to TanStack SSR handler
    return (
      handler as { fetch: (r: Request) => Response | Promise<Response> }
    ).fetch(req);
  },
});

console.log(`GreenExpress serving on http://${HOST}:${String(PORT)}`);