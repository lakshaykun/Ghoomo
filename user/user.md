User Side App Structure
Login (OTP)
  ↓
Home Map Screen
  ↓
Ride Request
  ↓
Driver Assigned
  ↓
Live Ride Tracking
  ↓
Ride Completed
  ↓
Rate Driver

1. Login Screen
Simple phone OTP login.
Features:
Phone number input
Send OTP
Verify OTP

2. Home Screen (Main Screen)
This is the most important screen.
Components:
Top section:
Where are you going?
Map section:
Google Map
Current location
Pickup pin


Bottom card:
Pickup: IIT Ropar Main Gate
Drop:  Enter destination
Buttons:
Request Ride

3. Pickup & Drop Selection
User can:
Search location
Enter landmark or area
Select location on map
Example:
Pickup
[ IIT Ropar Main Gate ]

Drop
[ Ropar Bus Stand ]
When user taps map:
latitude
longitude


are saved.

4. Request Ride Screen
After clicking Request Ride.
Pickup: IIT Main Gate
Drop: Bus Stand

Fare: ₹60 (The driver will decide the fare on accepting the ride_request)
Distance: 3.2 km

[ Confirm Ride ]
Backend creates:
ride_requests

5. Searching for Driver
UI:
Finding nearby driver...
Searching autos near you
Backend:
nearest driver algorithm
Driver receives request.

6. Driver Assigned Screen

Show:
Driver info:
Driver: Rajesh Kumar
Vehicle: PB12 AB 1234
Rating: ⭐ 4.8
Phone: Call button
Map shows:
driver location


pickup point


Status:
Driver arriving in 3 minutes



7. Live Ride Tracking
Map updates in real-time.
Shows:
Driver location
Pickup location
Route
ETA
Status updates:
Driver arrived
Ride started
On the way
Backend updates:
gps_logs
rides.status


8. Ride Completed Screen
Ride Completed

Fare: ₹80
Distance: 3.5 km

[ Rate Driver ]


9. Rate Driver
Rate your driver

⭐ ⭐ ⭐ ⭐ ⭐

Write review (optional)

Submit
Stored in:
driver_ratings



Additional features:

1. Favorite Locations
Students frequently go to:
Main Gate


Bus Stand


Railway Station


Sector 70 Mohali


Add:
Saved locations

2. Ride History
Past rides
Fare
Driver
Date

