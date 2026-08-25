# Driver Rating & On-Time Performance — v1 Algorithm & Thresholds

Owner-refined scope (2026-08-25): drivers are scored on (a) on-time delivery performance and
(b) customer ratings. Below a set threshold the driver gets an in-app **warning**; once the score
hits the deactivation threshold the driver is **deactivated** (can no longer claim orders / appear
as active).

## What is recorded
- **Per-delivery on-time boolean** (`orders.on_time`): computed when an order reaches `delivered`.
  - **Scheduled orders** (`scheduled_delivery_at` set): on time if delivered on/before window start + 15 min grace.
  - **ASAP orders** (no window): on time if delivered within 60 min of order creation.
  - **Pickup/curbside / unassigned** orders have no driver → excluded from a driver's score.
- **Customer ratings** (`order_ratings`): 1–5 stars + optional comment, submitted on the customer
  tracking page after an order is delivered. One rating per order (duplicate → 409); rating a
  non-delivered order or an order with no driver → 400. Only the order's customer or an admin can rate.

## Composite score (0…1)
Computed once a driver reaches the minimum delivery count, over their delivered orders:
```
ratingScore = (avgCustomerRating − 1) / 4        // 1★ → 0, 5★ → 1
onTimeRate  = onTimeDeliveries / scoredDeliveries
composite   = 0.5 × ratingScore + 0.5 × onTimeRate
```
If a driver has no ratings yet, `ratingScore` defaults to 0.5 (neutral) so a lack of ratings does
not itself trigger action; on-time rate likewise defaults neutral if nothing is scored.

## Status transitions
| Status       | Condition                                        | Effect |
|--------------|--------------------------------------------------|--------|
| `scoring`    | delivered count < MIN_DELIVERIES                 | No warning/action |
| `active`     | composite ≥ WARN_SCORE                           | None |
| `warning`    | DEACTIVATE_SCORE ≤ composite < WARN_SCORE        | In-app "at risk of deactivation" banner; still active |
| `deactivated`| composite < DEACTIVATE_SCORE                     | `drivers.is_active=0` — cannot claim orders / appear active; surfaced in admin |

## Default thresholds (tunable — `DRIVER_SCORING` in `src/lib/driverPerformance.ts`)
| Constant              | Default | Rationale |
|-----------------------|---------|-----------|
| `minDeliveries`       | 10      | Minimum-delivery guard: one bad rating can't nuke a new driver. Scoring/decisions only start at 10 delivered orders. |
| `warnScore`           | 0.40    | ≈ 2.6★ at 50% on-time, or 1★ at 80% on-time. Catches genuinely poor performers without alarming average drivers. |
| `deactivateScore`     | 0.25    | ≈ 1★ at 50% on-time, or 3★ at 0% on-time. Only clearly failing drivers are removed. |
| `lookbackDeliveries`  | 50      | Score is computed over the last 50 delivered orders (or all, if fewer) to keep it current. |
| `asapDeliveryMinutes` | 60      | ASAP "on time" = delivered within 60 min of order creation. |
| `scheduledGraceMinutes` | 15   | Scheduled orders are "on time" if delivered within 15 min after the window start. |

Thresholds are code-constant in `src/lib/driverPerformance.ts` so they are easy to tune without a
schema change. Pick new values and the same algorithm applies via the `/api/drivers/me/performance`
and `/api/admin/drivers/performance` endpoints.

## Endpoints
- `POST /api/orders/:id/rating` — customer 1–5★ + comment (delivered-only, one per order).
- `GET  /api/drivers/me/performance` — driver's avg rating, on-time rate, composite, status (driver).
- `GET  /api/admin/drivers/performance` — all drivers' scores + status for admin review/override.

## Admin override
`GET /api/admin/drivers/performance` surfaces status for all drivers. To override a deactivation,
an admin sets `drivers.is_active` back to 1 directly (no UI yet in this PR; flagged for follow-up).
