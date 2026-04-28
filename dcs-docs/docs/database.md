# Database & System Overview

## Overview

The application uses **Supabase** as its backend service for:

- Authentication
- Database storage (PostgreSQL)
- File storage (profile images)

The database is organised around user accounts, profiles, chores, repairs, and notifications.

---

## Authentication System

Authentication is handled using **Supabase Auth**.

### Key Features

- Email and password sign-in
- User registration
- Password reset using OTP (one-time code)
- Session management

### Behaviour

- Users are authenticated through `supabase.auth`
- Sensitive authentication data is handled securely by Supabase
- App-specific data is stored separately in the database

---

## Profiles Table

**Table:** `profiles`

### Purpose

This table stores user-specific data that is not handled by Supabase Auth.

### Key Fields

- `id` — linked to the Supabase Auth user ID
- `display_name` — the user’s chosen name
- `is_manager` — determines whether the user is a manager or student
- `avatar_url` — stores the profile picture
- `is_deleted` — indicates if the account has been soft deleted
- `deleted_at` — stores the time of deletion

### Behaviour

- A profile is automatically created when a user signs up
- User roles are determined using `is_manager`
- Profile data is used across the app for display and permissions

---

## Soft Delete System

Instead of permanently deleting users, the system uses a **soft delete approach**.

### Behaviour

When a user deletes their account:

- `is_deleted` is set to `true`
- `deleted_at` stores the deletion timestamp
- personal data is anonymised
- the user is logged out

### Purpose

- Prevents permanent data loss
- Maintains database relationships
- Allows better tracking and auditing

---

## Notification System

The application includes a flexible notification system.

---

### Notification Preferences

**Table:** `notification_preferences`

### Purpose

Stores each user’s notification settings.

### Structure

- `user_id` — links to the user
- `preferences` — a JSON object storing notification settings

### Behaviour

- Users can enable or disable specific notifications
- Includes a global toggle (`all_notifications`)
- If no preferences exist, notifications default to enabled

---

### In-App Notifications

**Table:** `in_app_notifications`

### Purpose

Stores notifications that appear inside the app.

### Key Fields

- `user_id`
- `title`
- `message`
- `type`
- `is_read`
- `created_at`

### Behaviour

- Notifications are only created if allowed by user preferences
- Users can mark notifications as read
- Notifications are shown in reverse chronological order

---

### Notification Metrics

**Table:** `notification_delivery_metrics`

### Purpose

Tracks how notifications are delivered.

### Key Fields

- `user_id`
- `preference_key`
- `delivered` (true/false)
- `latency_ms`
- `error_message`

### Behaviour

- Records whether a notification was delivered successfully
- Logs any errors or delays
- Helps with debugging and monitoring performance

---

## File Storage (Profile Images)

The application uses Supabase Storage.

### Bucket

- `User Avatars`

### Behaviour

- Users can upload profile images
- File type and size are validated before upload
- Old images are removed when replaced
- Public URLs are stored in `profiles.avatar_url`

---

## User Roles

User roles are determined using the `profiles` table.

### Roles

- `manager`
- `student`

### Behaviour

- Role is based on the `is_manager` field
- Used for routing and access control
- Determines which interface the user sees

---

## Summary

The database design separates:

- authentication (handled by Supabase Auth)
- application data (stored in tables like `profiles` and notifications)

Key design principles include:

- clear separation of responsibilities
- soft deletion instead of permanent removal
- flexible notification settings
- a scalable user profile system

---

## Backend Implementation (Code Structure)

The database is accessed and managed through backend utility functions located in the `lib/` folder.

### Authentication Functions

**File:** `lib/auth.ts`

Handles all authentication-related logic, including:

- user sign-in and sign-up using Supabase Auth  
- password reset requests  
- retrieving the current authenticated user  
- updating user profile data (e.g. display name)  
- soft deleting user accounts  

These functions act as a layer between the frontend and Supabase, ensuring validation and error handling are consistently applied.

---

### Notification System Functions

**File:** `lib/notifications.ts`

Handles all notification-related operations:

- retrieving user notification preferences  
- updating notification settings  
- creating in-app notifications  
- marking notifications as read  

The system checks user preferences before creating notifications, ensuring users only receive relevant updates.

---

### Data Access Pattern

All database interactions follow a consistent pattern:

1. Validate input (using validation functions)
2. Call Supabase (`supabase.from(...)`)
3. Handle errors using `formatErrorMessage`
4. Return structured results to the frontend

### Benefits

- Keeps database logic separate from UI code  
- Improves maintainability and readability  
- Ensures consistent error handling across the app  
- Makes the system easier to scale and extend  
