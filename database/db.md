users
    id (PK)
    name
    email (unique)
    phone_number (unique)
    password_hash
    role (student | driver | admin)

    created_at
    updated_at




drivers
    id (PK)
    user_id (FK -> users.id)

    vehicle_number
    vehicle_type (auto | cab)
    license_number

    status (approved | pending | suspended)
    is_available (boolean)

    current_latitude
    current_longitude

    created_at
    updated_at



ride_requests
    id (PK)
    student_id (FK -> users.id)
    matched_driver_id (FK -> drivers.id)
    pickup_location
    drop_location
    pickup_latitude
    pickup_longitude
    drop_latitude
    drop_longitude
    request_time
    status (pending | matched | cancelled)


User adds landmark and major area in drop_location and pickup_location and selects the location on map to get latitude and longitude.


rides
    id (PK)

    request_id (FK -> ride_requests.id UNIQUE)

    student_id (FK -> users.id)
    driver_id (FK -> drivers.id)

    pickup_location
    drop_location

    fare
    distance

    status (accepted | started | completed | cancelled)

    start_time
    end_time

    created_at
    updated_at



gps_logs
    id (PK)
    driver_id (FK -> drivers.id)
    ride_id (FK -> rides.id)

    timestamp
    latitude
    longitude



driver_ratings
    id (PK)

    ride_id (FK -> rides.id UNIQUE)
    student_id (FK -> users.id)
    driver_id (FK -> drivers.id)

    rating (1-5)
    review_text

    created_at



campus_entry_logs
    id (PK)
    ride_id (FK -> rides.id)
    driver_id (FK -> drivers.id)

    entry_time
    exit_time

    created_at


Campus_entry_logs created by backend whenever the driver enters the campus areas.

