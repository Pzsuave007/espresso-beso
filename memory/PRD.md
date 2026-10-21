# Espresso Beso - Mobile Coffee Service Platform PRD

## Original Problem Statement
Build a modern web platform for "Espresso Beso" - a mobile espresso coffee service operating from a minivan/SUV in the Spokane area. The platform optimizes logistics, reduces idle time, and allows customers to pre-order and pay before arrival.

## User Personas
1. **Coffee Customer** - Office workers, coffee enthusiasts who want to pre-order and skip the wait
2. **Group Coordinator** - Office managers who want to arrange coffee visits for their team
3. **Business Owner** - Van operator who needs to manage zones, orders, and track daily revenue

## Core Requirements
- Zone-based scheduling (Spokane Valley, South Hill, North Spokane, Downtown)
- Pre-order system with drink customization (milk type, syrups, size, extras)
- Online payment (PayPal, Venmo, Cash App, Zelle)
- Live van location tracking using Leaflet/OpenStreetMap
- Group request system for workplace visits
- Owner admin dashboard with order management
- Mobile-first, QR-friendly design
- Dual operational modes: Mobile (delivery available) and Stationary (pickup only)

## What's Been Implemented

### Backend (FastAPI + MongoDB)
- Zone management API (CRUD operations)
- Menu management API with customization options (full CRUD)
- Order creation and management with order types (at_location/delivery)
- PayPal REST API integration for payments
- Group request API
- Van location tracking API with Mobile/Stationary modes
- Admin authentication (JWT-based register/login)
- Daily order summary endpoint
- Schedule management API for daily zone configuration
- Custom zone/location support for events

### Frontend (React + Tailwind)
- Homepage with hero, zone selector, live map
- Menu page with category filters, search, product cards
- Cart with localStorage persistence, 3-step checkout flow
- Drink customization modal with price modifiers
- Order success page for both PayPal and manual payments
- Group request form
- Admin portal (login/register, dashboard, orders, requests)
- **Admin Menu Management** - Full CRUD for drinks
- **Admin Schedule Management** - Toggle zones, set time windows, add custom locations
- **Admin Location Tracker** - Live GPS tracking with Mobile/Stationary mode toggle
- Mobile-responsive design with bottom navigation
- Smart delivery minimum (5-drink min when customer is >3 miles away)
- Conditional address collection (only for "Come to me" orders)

### Payment System
- PayPal API integration (Credit/Debit cards + PayPal balance)
- Manual payment options: Venmo (@Paul-Zacapantzi), Cash App ($PZsuave), Zelle (971-227-0595)
- Payment status: pending, pending_verification, paid

### Mobile/Stationary Mode Feature (March 1, 2026)
- Backend: VanLocation model supports `mode` (mobile/stationary) and `stationary_location_name` fields
- Admin: Location tracker page has toggle for Mobile vs Stationary mode
- Admin: When Stationary selected, input field appears for location name (e.g., "Soccer Match at Lincoln Park")
- Customer: Checkout disables "Come to me" option when van is in Stationary mode
- Customer: Shows notice with stationary location info when in Stationary mode

### Visual Indicators for Stationary Mode (March 1, 2026)
- Homepage: Prominent burgundy banner "We're Parked Today!" with location name and "Order for Pickup" button
- Map Marker: Different icon (pin instead of coffee cup) with burgundy color and location name
- Map Marker: Dashed ring animation instead of pulsing (indicates stationary)
- Below Map: "Come Find Us!" section replaces "Am I near you?" with location info and direct order CTA

### Order Logistics & Route Optimization (March 1, 2026)
- **Order Dashboard Redesign:**
  - Stats bar: Active Orders, Preparing, Ready, Deliveries counts
  - Filter tabs: Active | All | 📍 Here | 🚗 Delivery
  - Group by: None, By Location, By Status
  - View modes: List view and Route Map view
- **Quick Action Buttons:**
  - 📞 Call button - one-tap dial customer
  - 🧭 Navigate button - opens Google Maps with delivery address
  - Status workflow buttons: Confirm → Start Making → Mark Ready → Complete
- **Route Optimization View:**
  - Blue "Optimized Delivery Route" banner with stop count, total miles, estimated time
  - "Start Route" button opens Google Maps with all stops as waypoints
  - Delivery sequence list ordered by nearest-neighbor algorithm
  - Each stop shows: number, customer, address, distance from previous, cumulative time, order value
  - Individual call/navigate buttons per stop

### Order History & Daily Reports (March 1, 2026)
- **Order Archiving:**
  - Completed orders automatically archived with `completed_at` timestamp
  - Active orders view stays clean (only shows pending/preparing/ready)
- **History Page:**
  - New "History" nav item in admin sidebar
  - Shows last 30 days of completed orders grouped by date
  - Each day card shows: date, order count, drink count, revenue, completed/cancelled badges
- **Daily Report View:**
  - Click on any day to see detailed breakdown
  - Stats: Revenue, Orders, Drinks, Avg Order Value
  - Top Drinks leaderboard (ranked by quantity sold)
  - Payment Methods breakdown by revenue
  - Full list of orders for that day with status and amounts
  - "Back to Overview" button to return to daily summary

### Smart Priority Queue & Order Tracking (March 1, 2026)
- **Smart Priority System:**
  - Balances fairness (wait time) + efficiency (distance)
  - Formula: `priority = (wait_minutes × 3) - (distance_miles × 2)`
  - Customers waiting longer get priority boost even if farther away
  - Shows priority score (⚡) and wait time badge in Route Map view
- **Customer Order Tracking Page (`/track/:orderId`):**
  - Real-time order status with visual progress steps
  - Queue Position display (#1 of 15 orders)
  - Estimated Wait Time (e.g., "0-9 min")
  - Status messages for each stage
  - Auto-refreshes every 30 seconds
  - Works on mobile with clean UI
- **Order Confirmation with ETA:**
  - Order Success page now shows queue position and estimated wait
  - "Track Your Order" button links to tracking page
- **Backend Endpoints:**
  - `GET /api/orders/queue/active` - Active orders with priority scores and ETAs
  - `GET /api/orders/track/:orderId` - Public tracking endpoint (no auth)

### Live Traveling Status on Map (March 1, 2026)
- **"Go" Button in Route Map:**
  - Clicking "Go" on a delivery order sets van status to "traveling"
  - Updates the live map marker to show destination
  - Opens Google Maps for navigation
- **Live Map Updates:**
  - Van icon changes to truck/van SVG when traveling
  - Blue speech bubble shows "🚐 On my way!"
  - Displays destination: "➡️ Tech Corp" (customer/business name)
  - All customers can see who the van is heading to
- **Customer Tracking - "Van Coming to Me":**
  - When van is traveling to your order, you see special alert
  - Big blue banner: "On the way to YOU!"
  - Header changes to "🚐 Almost There!"
  - Distance from van shown ("4.2 miles away")
- **Backend Endpoints:**
  - `POST /api/van-location/traveling-to/{order_id}` - Set traveling to order
  - `POST /api/van-location/arrived` - Clear traveling status

### Admin Quick Actions & PWA (March 1, 2026)
- **Verify Payment Button:**
  - "💰 Verify Paid" button on orders with pending payment
  - Works for Venmo, CashApp, Zelle, and Cash payments
  - Marks payment as verified in the system
- **Cash Payment Option:**
  - Added "Cash - Pay at pickup" as payment method
  - Shows in checkout alongside other options
- **Cancel Order:**
  - "✕" cancel button on each active order
  - Confirms before canceling
  - Adds cancelled_at timestamp
- **New Order Sound Notification:**
  - 🔔 Two-beep audio alert when new orders arrive
  - Toggle button to enable/disable sound
  - Toast notification: "🔔 1 new order!"
  - Orders poll every 30 seconds
- **Contact Footer:**
  - Phone: 503-985-6472 (clickable tel: link)
  - Instagram: @espressobeso (clickable link)
  - Tagline: "Mobile Coffee, Made with Love ☕"
- **PWA (Progressive Web App):**
  - Manifest.json for "Add to Home Screen"
  - Service worker for offline support
  - App icon (☕ on gold background)
  - Starts directly to /admin/orders
  - Works on iOS and Android

### Design
- Brand colors: Cream (#F5F0E1), Gold (#8B6914), Burgundy (#8B1A1A)
- Typography: Poppins (headings) + Inter (body)
- Espresso Beso logo integration throughout

## Prioritized Backlog

### P0 (Critical)
- All MVP features implemented

### P1 (High Priority - Next Phase)
- PWA for Tracker - Make app installable on owner's phone
- Full E2E PayPal test with sandbox environment
- Email/SMS notifications (order confirmation, van arriving soon)

### P2 (Medium Priority)
- QR code generation for quick ordering at specific locations
- Customer accounts for order history
- Loyalty program / rewards
- Advanced analytics dashboard
- Multi-day schedule management

### P3 (Nice to Have)
- Route optimization suggestions
- Inventory tracking
- Apple Pay / Google Pay

## Recent Updates (March 1, 2026)
- **Bug Fix**: Fixed payment button error for Cash and Zelle options. The `handlePaymentClick` function was referencing `PAYMENT_OPTIONS` which didn't exist - corrected to use `MANUAL_PAYMENT_OPTIONS`.
- **Bug Fix**: Fixed critical bug where Order Success page would redirect to "Payment Failed" after ~1 minute for Cash/manual payments. The issue was in the `useEffect` dependency array causing re-runs that triggered the failed state. Split into two separate effects for manual and Stripe payment flows.

## Next Tasks
1. Full E2E PayPal payment test with sandbox environment
2. Out-of-Stock toggle for menu items
3. Add SMS/Email notification system
4. Generate QR codes for quick ordering

## Tech Stack
- Frontend: React 19, Tailwind CSS, Leaflet, Shadcn/UI, @paypal/react-paypal-js
- Backend: FastAPI, Motor (MongoDB async), PyJWT, paypalrestsdk
- Database: MongoDB
- Payments: PayPal REST API + Manual options
- Maps: Leaflet + OpenStreetMap (free, no API key)

## Key API Endpoints
- `GET/POST /api/van-location` - Van location with mode support
- `GET/POST/PUT/DELETE /api/menu` - Menu management
- `PUT /api/zones/today/schedule` - Daily schedule management
- `POST /api/paypal/create-order` - Create PayPal payment
- `POST /api/paypal/capture-order` - Capture PayPal payment
- `POST /api/orders` - Create order with order_type and delivery_address

## Test Credentials
- Admin: Register at /admin/login
- Test account: modetest@test.com / test123

## Update — June 2026
- Homepage redesigned (events/catering focus); package prices now load live from /api/event-settings (admin-editable).
- Instant Quote ranges: 5-10 Coffee Visit ($/drink x guests), 11-25 Small Event, 26-50 Medium Event, 50+ Custom Quote.
- Coffee Visit = "5-10 drinks", Small = "11-25 guests" (defaults + startup migration in server.py).
- New /live page (LivePage.jsx): live map, online/offline status, nearby check, how it works, today's zones. Links: header, mobile menu, bottom nav "Live", homepage banner, footer.
- Fixes: map no longer covers sticky header, footer logo on light pill, no mobile strip under footer.
- Tested: iteration_4 (homepage pass), iteration_5 (/live pass, map z-index fixed after), self-tested calculator ranges.

## Backlog
- P1: QR codes linking to menu/ordering
- P2: Out-of-stock toggle in menu manager
- Future: customer accounts, CSV export, customer notes, FAQ/testimonials
- Offline mode (June 2026): /menu always visible; offline banner + Book an Event; Add to Order disabled ("Ordering Offline") on cards & customize page; cart shows offline screen (cart kept); backend ensure_shop_online() blocks POST /api/orders and /api/stripe/create-checkout with 403. Tested iteration_6 (pass).
- Homepage 'Perfect for Any Occasion' now driven by admin event_types (enabled only); fixed bug where disabled types still showed (June 2026).
- 'Birthday Parties' event type renamed to 'Family Events' (key 'birthday' kept; icon 'home'; startup migration renames & enables it once; admin email shows 'Family Event').
