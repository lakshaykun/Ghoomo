# Ghoomo — Campus Mobility Platform

## 1. Title
**Ghoomo**  
Real-time campus rides + bus bookings in one app

Tagline: *Move faster across campus, without friction.*

---

## 2. Problem
- Campus travel is fragmented: rides, buses, tracking, and admin oversight are disconnected.
- Riders waste time waiting for availability and confirmation.
- Drivers lack a clean, real‑time workflow for assigned trips.
- Admins lack a single view of routes, availability, and demand.

---

## 3. Solution
Ghoomo unifies:
- Ride booking (bike/auto/cab) with live tracking
- Bus route booking with seat management
- Driver operations + verification flows
- Admin dashboard for routes, drivers, and metrics

---

## 4. Key Features
- One‑tap ride booking + live tracking
- Bus seat booking with waitlist
- Driver live status, OTP verification, trip history
- Admin control of routes, schedules, capacity
- Push notifications for ride events

---

## 5. Primary Workflow (User)
1. User selects ride type or bus
2. Enters pickup + destination
3. Gets live route estimate
4. Confirms booking
5. Tracks driver in real time
6. Completes ride and views history

---

## 6. Bus Booking Workflow
1. User chooses a bus route
2. Sees available seats + timings
3. Books seat or waitlist
4. Gets QR ticket for boarding
5. Ride is verified by driver

---

## 7. Driver Workflow (Cab/Auto/Bike)
1. Driver goes online
2. Receives ride assignment
3. Accepts ride and navigates
4. Verifies OTP
5. Completes ride
6. Trip history saved for driver

---

## 8. Driver Workflow (Bus)
1. Bus driver selects assigned route
2. Starts shift and scans tickets
3. Validates passengers in real time
4. Tracks seat occupancy

---

## 9. Admin Workflow
1. Create and manage bus routes
2. Monitor live rides and bookings
3. Review system metrics and history
4. Manage drivers and availability

---

## 10. Architecture Overview
**Frontend:** React Native (Expo)  
**Backend:** Node.js API  
**Storage:** JSON file (default) or PostgreSQL  
**Routing:** OSRM + cache + fallback  
**Notifications:** Expo Push

---

## 11. Architecture Diagram (Text)
**Mobile App**  
↕ REST API  
**Node Backend**  
↕ Storage (Postgres or File)  
↕ External Services  
- OSRM routing  
- OpenStreetMap geocoding  
- Push notifications

---

## 12. Real‑Time Design
- Cached routing for fast responses
- Route fallback when OSRM is slow
- Driver status polling with live updates
- Push alerts for ride and assignment changes

---

## 13. Use Cases
- **Students:** quick rides between departments
- **Staff:** reliable campus transport
- **Night safety:** fast booking + tracking
- **Events:** manage spike demand with buses
- **Admins:** centralized visibility of mobility

---

## 14. Differentiators
- Single app for rides + buses
- Driver workflows for both private rides and bus fleets
- Admin control tailored for campus ops
- Lightweight backend, fast to deploy

---

## 15. Business Value
- Reduced wait time for riders
- Better utilization of drivers and buses
- Lower operational chaos for admins
- Scales from small campus to multi‑campus

---

## 16. Roadmap (Optional)
- Real‑time socket updates
- Driver navigation integration
- Analytics dashboard expansion
- Scheduled rides + pass system

---

## 17. Call To Action
