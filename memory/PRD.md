# Garage Tracker - Product Requirements Document

## Overview
A car maintenance tracking application that helps users manage their vehicle maintenance schedules, track mileage, find nearby mechanics, and receive reminders.

## Original Problem Statement
Create an app to track car maintenance. For each car, add details about the car, the last maintenance performed, and when the next maintenance is due for tasks like oil changes, filter replacements, coolant checks, brakes, etc. Also include a mileage tracker.

## Core Requirements
- User authentication to secure each account (JWT-based)
- Reminders via email (SendGrid) and in-app pop-ups
- Mileage tracking for each maintenance task and predicting next service mileage
- Light/dark mode UI
- Location services to find nearby mechanics (Google Maps)
- Image upload (from device or URL) when adding a new vehicle
- "Request Early Replacement" button for maintenance items
- Multi-language support: English, Spanish, Romanian, Russian, Korean, Chinese, French
- Option to switch between miles and kilometers
- App name: "Garage Tracker"

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT tokens

## Implemented Features (as of Feb 27, 2025)

### Authentication
- [x] User registration with email/password
- [x] User login with JWT tokens
- [x] Protected routes

### Vehicle Management
- [x] Add new vehicles with make, model, year, color, license plate
- [x] Upload vehicle images (file upload or URL)
- [x] Edit vehicle details
- [x] Delete vehicles
- [x] View all vehicles on dashboard

### Maintenance Tracking
- [x] Add maintenance tasks (oil change, filters, brakes, etc.)
- [x] Track last performed mileage and date
- [x] Calculate next due mileage based on interval
- [x] Status indicators: Good, Due Soon, Overdue
- [x] Complete maintenance tasks
- [x] Delete maintenance tasks
- [x] Request early replacement with reason

### Mileage Tracking
- [x] Log mileage entries with date and notes
- [x] View mileage history
- [x] Current mileage display on vehicle cards

### Internationalization (i18n)
- [x] Full multi-language support (7 languages)
- [x] Language selection in settings
- [x] All pages translated: Login, Register, Dashboard, CarDetail, Settings, NearbyMechanics
- [x] Navigation menu translated
- [x] Language preference persisted in localStorage

### Distance Units
- [x] Miles/Kilometers toggle in settings
- [x] All distances displayed in selected unit
- [x] Preference persisted in localStorage

### Theme
- [x] Light/Dark mode toggle
- [x] Theme persisted in localStorage

### Nearby Mechanics
- [x] Geolocation-based search
- [x] Quick search buttons for common services
- [x] Integration with Google Maps search

### Settings
- [x] Language selection
- [x] Distance unit selection
- [x] Theme toggle
- [x] Email notification preferences
- [x] In-app notification preferences
- [x] Reminder lead time configuration

## API Endpoints
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/cars` - List user's cars
- POST `/api/cars` - Add new car
- GET `/api/cars/{car_id}` - Get car details
- PUT `/api/cars/{car_id}` - Update car
- DELETE `/api/cars/{car_id}` - Delete car
- GET `/api/maintenance` - List maintenance tasks
- POST `/api/maintenance` - Add maintenance task
- PUT `/api/maintenance/{task_id}` - Update task
- DELETE `/api/maintenance/{task_id}` - Delete task
- POST `/api/maintenance/{task_id}/complete` - Complete task
- POST `/api/maintenance/{task_id}/request-replacement` - Request early replacement
- POST `/api/maintenance/{task_id}/cancel-replacement` - Cancel replacement request
- GET `/api/mileage/{car_id}` - Get mileage logs
- POST `/api/mileage` - Add mileage log
- GET `/api/dashboard/stats` - Get dashboard statistics

## Database Collections
- `users`: User accounts
- `cars`: Vehicle information
- `maintenance_tasks`: Maintenance records
- `mileage_logs`: Mileage history

## Known Performance Improvements (P1 - Backlog)
- N+1 query optimization in `/api/maintenance` endpoint
- N+1 query optimization in `/api/dashboard/stats` endpoint

## Future Enhancements (Backlog)
- Service history export (PDF/CSV)
- Image cropping/resizing for vehicle photos
- Push notifications
- Recurring maintenance reminders via email (SendGrid integration)
