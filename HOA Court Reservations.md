# PRD: Pickleball Court Hour-Allocation PWA

*   **Version:** 2.0 (MVP Launch Spec)
*   **Status:** Finalized
*   **Author:** PWA/Push/Pickleball Expert
*   **Date:** October 26, 2023

## 1. Introduction & Problem Statement

Our community's current court booking system is inadequate for its primary use case: organizing group pickleball games. It creates friction through unfair court allocation, lacks a method for groups to book collaboratively, and suffers from inefficiency due to no-shows and a poor mobile experience. This project will build a mobile-first Progressive Web App (PWA) to solve these problems with a fair, automated, and flexible **Hour-Based Allocation System** designed around the core need for **Flexible Group Booking**.

## 2. User Personas

*   **The Group Organizer (Sarah):** Organizes games for 8-16 people, a mix of members and guests. Needs to reserve multiple courts and fairly coordinate the hour cost among members, without the booking failing if one or two people can't make it.
*   **The Member Player (Brenda):** Plays in Sarah's group. Wants a simple way to accept a game invitation and have her share of the hours deducted automatically.
*   **The Last-Minute Player (Tom):** Wants to quickly see if a court is free *right now* and book it for himself without any friction.
*   **The HOA Administrator (Admin Anna):** Needs a system that automates rule enforcement, reduces disputes, and provides a clear audit trail of court usage, including guest counts.

## 3. Goals & Success Metrics

| Goal                        | Metric(s)                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Solve Group Booking**     | - High adoption rate of the "Flexible Group Booking" feature for multi-court reservations. <br>- High confirmation rate (>75%) for pending group bookings. |
| **Increase Fairness**       | - Reduction in user complaints about "court hogging" or unfair cost-sharing. <br>- Consistent usage across a wide percentage of member households. |
| **Improve Court Utilization** | - Reduction in the no-show rate (to be measured in Phase 2). <br>- Increase in last-minute, single-player bookings. |
| **Enhance User Experience** | - High user satisfaction score (via beta tester surveys). <br>- >90% of bookings made via mobile devices. |

## 4. Phased Rollout Strategy

### Phase 1: MVP - The Core Group Booking Engine

The goal is to launch a fully functional application that solves the most critical problem: fair and flexible group bookings.

**Core Features for MVP:**
*   User Authentication & Household Management
*   The Hour Allocation System (Prime/Standard) & Bi-Weekly Reset
*   **Flexible Group Booking (with Minimums & Guests)**
*   Last-Minute Solo Booking
*   Core Cancellation Logic
*   Basic PWA Functionality (Installable, HTTPS)
*   **Essential Push Notifications (for all Group Booking actions & reminders)**
*   Simple Admin Dashboard

### Phase 2: Automation, Enhancements & Community Features

With the core booking engine validated, Phase 2 will focus on reducing admin workload and enriching the user experience.

**Features for Phase 2:**
*   Phone-Based GPS Check-in & Automated No-Show Penalties
*   Advanced Mobile UX (Calendar Heat Map, One-Tap Repeat Booking)
*   "Public" Community Events (organizer books, anyone can sign up)
*   Advanced Admin Analytics (guest tracking, peak usage reports)

## 5. Feature Requirements (User Stories) - MVP

#### User Authentication & Hour Management
*   `[MVP]` **As a user,** I can sign up/log in, with my account tied to an HOA household.
*   `[MVP]` **As a user,** I can see my current Prime and Standard hour balances.
*   `[MVP]` **As a system,** I must reset all user hour balances every other Monday at 3:00 AM.

#### Flexible Group Booking
*   `[MVP]` **As an Organizer,** I want to initiate a booking for one or more courts and specify the **total number of players**, breaking it down into **invited members** and the **number of guests**.
*   `[MVP]` **As an Organizer,** I want to set a **minimum number of *members*** that must accept for the booking to be confirmed.
*   `[MVP]` **As an Organizer,** I must have enough hours to cover my personal share of the cost, calculated based on the *minimum number* of members.
*   `[MVP]` **As a system,** when a group booking is initiated, I must place the courts in a **"Pending"** state for a limited time.
*   `[MVP]` **As an Invitee,** I want to receive a push notification asking me to "Accept" or "Decline" the invitation.
*   `[MVP]` **As a system,** once the minimum number of members has accepted, I must **Confirm** the booking, recalculate the final hour cost based on the *actual number* of accepting members, deduct the cost from each member's balance, and send a confirmation notification.
*   `[MVP]` **As a system,** if the minimum member count is not met by the deadline, I must **cancel** the pending booking, release the courts, and notify the organizer and any who had accepted.
*   `[MVP]` **As an Organizer,** I want to view the real-time status of my pending event.

#### Other Booking Types
*   `[MVP]` **As a user,** I want to book a court for just myself within 12 hours of the start time for **zero** hour cost.

#### Cancellation & Notifications
*   `[MVP]` **As an Organizer,** I can cancel a "Pending" or "Confirmed" booking. If a confirmed booking is cancelled 48+ hours in advance, all participating members are refunded their hours.
*   `[MVP]` **As a user,** I will receive push notifications for invitations, confirmations, cancellations, and booking reminders (49h, 24h, 2h).

#### Admin
*   `[MVP]` **As an admin,** I can view all bookings and their status (`Pending`, `Confirmed`, `Cancelled`).
*   `[MVP]` **As an admin,** I can manage users and configure system-wide variables (hour allocations, prime time definitions).

---

# Project Kickoff: Initial Tasks

This list breaks down the initial work into logical epics for development planning.

### Sprint 0: Project Foundation
1.  **Tech Stack:** Finalize choices: SvelteKit, TypeScript, Supabase, Vercel.
2.  **Local Setup:** Create the SvelteKit project locally using `npm create svelte@latest`.
3.  **GitHub Repo:** Create a new, empty repository on GitHub.
4.  **Initial Push:** Link the local project to the GitHub repo and push the initial commit.
5.  **Vercel Project:** Create a new project on Vercel, importing the GitHub repository.
6.  **Supabase Project:** Create a new project on Supabase and save the API keys.
7.  **Environment Variables:** Add Supabase API keys as environment variables in the Vercel project settings.

### Epic 1: User & Authentication
1.  **Backend:** Design the database schema for `Users` and `Profiles` in Supabase.
2.  **Frontend:** Build the UI components for Login, Registration, and Password Reset (can be accelerated with v0).
3.  **Logic:** Implement the client-side logic in SvelteKit to call Supabase's built-in authentication functions.
4.  **State Management:** Create a Svelte store to manage the user's authentication state throughout the app.

### Epic 2: The "Hour" Economy
1.  **Backend:** Add `prime_hours` and `standard_hours` columns to your `Profiles` table in Supabase.
2.  **Backend:** Create a scheduled job (Vercel Cron Job) that runs a serverless function bi-weekly to reset the hour balances for all users.
3.  **Frontend:** Create a UI component in the user's profile/dashboard to display their current hour balances.

### Epic 3: The Flexible Group Booking Engine
1.  **Backend:** Design and build the database schema for `Bookings` and `BookingParticipants` in Supabase.
2.  **Frontend:** Build the multi-step booking creation UI.
3.  **Backend:** Create the serverless function (`/api/bookings/create`) to handle a new booking request, creating the `Pending` booking and `BookingParticipant` records.
4.  **Backend:** Create serverless functions for invitees to `Accept` or `Decline` an invitation.
5.  **Backend:** Develop the core confirmation/cancellation logic that is triggered by an acceptance or a scheduled cron job checking for expired holds.
6.  **Frontend:** Build the UI for an invitee to view and respond to a pending invitation.
7.  **Frontend:** Build the "My Bookings" page where users can see the status of their upcoming and pending games.

### Epic 4: Push Notifications
1.  **Frontend:** Implement the UI and logic for requesting push notification permission from the user.
2.  **Backend:** Create a new table in Supabase to store user `PushSubscription` objects.
3.  **Backend:** Create a serverless function to handle saving these subscription objects.
4.  **Backend:** Integrate a `web-push` library into a dedicated serverless function for sending notifications.
5.  **Backend:** Trigger this push notification function from the booking engine (e.g., on new invitation, confirmation, cancellation).
6.  **Frontend:** Write the PWA's Service Worker code (`service-worker.js`) to listen for push events and display notifications.