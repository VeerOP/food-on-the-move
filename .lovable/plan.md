## Admin Dashboard, Order Status & WhatsApp Notifications

### 1. Database (migration)
- Create `app_role` enum (`admin`, `customer`).
- Create `user_roles` table (user_id, role) with RLS + `has_role()` security-definer function.
- Add `order_status` enum values: `pending_payment`, `paid`, `preparing`, `out_for_delivery`, `delivered`, `cancelled`.
- Extend `orders` RLS so admins can `SELECT` and `UPDATE` all orders; same for `order_items` (SELECT).
- Add trigger to auto-update `orders.updated_at`.

### 2. Admin Dashboard (`/admin`)
- Route guarded by `has_role(uid, 'admin')`; non-admins redirected.
- Table of all orders: customer, phone, address, distance, total, UPI ref, status, created_at.
- Status dropdown per order → updates DB; customer sees new status in `/orders`.
- Filter by status; newest first.

### 3. Order Status UX
- Update `Orders.tsx` to show a colored status badge with the full lifecycle.
- Show status timeline on order card.

### 4. WhatsApp Notifications (owner-facing, no paid API)
- After successful UPI payment confirmation on `/pay`, show a **"Notify owner on WhatsApp"** button.
- Opens `https://wa.me/<owner_number>?text=<prefilled order summary>` (order id, items, total, address, UPI ref).
- Add owner WhatsApp number as a config constant (I'll ask below).
- Also send an auto-open prompt on the order-success screen so the customer just taps send.

### 5. Bootstrap first admin
- After migration, insert an `admin` row in `user_roles` for the owner's user_id (I'll ask which email).

### Technical notes
- Roles table isolated (no role column on `profiles`) to prevent privilege escalation.
- All admin checks use `public.has_role()` server-side via RLS — no client-side admin flags.
- WhatsApp uses free `wa.me` click-to-chat — no Twilio/API keys required. Can upgrade to Twilio later if desired.

### Questions before building
1. Which email should be the **first admin**? (I'll grant the role after they sign up.)
2. What **WhatsApp number** should receive order notifications? (with country code, e.g. +91XXXXXXXXXX)
