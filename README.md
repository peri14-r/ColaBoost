
# ColaBoost — Creator Collaboration Platform (v2 Full Rebuild)

ColaBoost is a full-stack creator-collaboration platform that helps creators find partners, collaborate, manage requests, message in real-time, boost visibility, and monetize.
This v2 rebuild includes a complete backend, Stripe payments, notifications, admin tools, and monetization features.

---

## Goal

Build a fully functional creator-collab platform with:

* Working authentication (email + Google OAuth)
* Profiles and search
* Collab requests
* Real-time chat
* Notifications
* Stripe subscriptions + boost payments
* Affiliate tools
* Sponsored ads
* Settings and admin tools

---

## Brand & Theme

* App name: ColaBoost
* Theme: Light + Dark mode
* Colors: Indigo (#4F46E5), Emerald (#10B981), Rose (#F43F5E), Slate neutrals
* UI: Rounded cards, soft shadows, Inter font

---

# Application Pages

### 1. Landing

Hero, Features, Pricing, Footer

### 2. Auth

Login, Signup, Forgot Password, Email verification
Email/password + Google OAuth
Complete profile wizard after signup

### 3. Dashboard

Suggested creators
Recent messages
Subscription status
Sponsored Ads widget
Boost My Profile button

### 4. Find Creators

Server-side search
Filters + pagination
Boosted and Pro profiles rank higher

### 5. Collab Requests

Create, Edit, View
Statuses: open, in_progress, completed, closed

### 6. Messages

Real-time 1:1 chat
Read receipts
Unread counters

### 7. Public Profile

`/u/{handle}`
Bio, niche, followers, platforms
Open requests
Contact button

### 8. Settings

Tabs: Profile, Account, Notifications, Billing, Security

### 9. Payments

Pricing
Stripe Checkout
Stripe Customer Portal

### 10. Monetization Page (New)

Explains boosts, ads, affiliate tools
Fully responsive

### 11. Admin

User management
Collab request moderation
Sponsored ads manager
Affiliate tools manager
Reports
Refunds
Feature flags

### 12. System Pages

404, 500, Privacy, Terms

---

# Database Schema

### users

id, email, emailVerifiedAt, provider, createdAt

### profiles

id (= user), displayName, handle, avatarUrl, bio, niche, skills[], location, followers, platforms, visibility, createdAt, updatedAt

### collab_requests

id, ownerId, title, description, category, tags[], budget, status, location, createdAt, updatedAt

### applications

id, requestId, applicantId, message, status, createdAt, updatedAt

### chats

id, participantA, participantB, createdAt

### messages

id, chatId, senderId, body, attachmentUrl, createdAt, readAt

### notifications

id, userId, type, title, body, link, read, createdAt

### subscriptions

id, userId, plan, stripeCustomerId, stripeSubscriptionId, status, currentPeriodEnd, createdAt, updatedAt

### payments

id, userId, amount, currency, kind, stripeSessionId, status, createdAt

### favorites

id, userId, targetType, targetId, createdAt

### reports

id, reporterId, targetType, targetId, reason, details, createdAt, resolved

### audit_logs

id, actorId, action, entity, entityId, metadata, createdAt

---

# New Monetization Tables

### boosts

id, userId, status, activatedAt, expiresAt

### sponsored_ads

id, title, imageUrl, linkUrl, active, createdAt

### affiliate_tools

id, name, iconUrl, description, linkUrl, createdAt

---

# Indexes

profiles: unique(handle), composite(niche, followers desc), FTS(displayName, bio, skills, location)
collab_requests: composite(status, createdAt desc), FTS(title, description, tags)
messages: chatId, createdAt
notifications: userId, createdAt desc
boosts: userId, expiresAt
sponsored_ads: active

---

# Authentication

Email/password + Google OAuth
Email verification required
Password reset
Login guards
Complete Profile Wizard

---

# Search

Full-text search
Filters: niche, skills, followers range, platforms, location
Pagination
300ms debounce

---

# Messaging

Real-time chat
Read receipts
Unread counters
Optimistic UI

---

# Notifications

Triggered on:

* Collab application events
* New messages
* Subscription updates
* Boost activation/expiration

Notification center
Mark all read
Email toggles
Rate-limited outbound emails

---

# Collabs

Users apply
Owner accepts → chat opens
Owner completes → feedback stored

---

# Profile

Public profile page
Avatar upload
Handle change
Visibility toggle

---

# Settings

Profile editing
Account changes
Notification preferences
Billing
Security (recent login sessions)

---

# Stripe Payments

### Subscription (Pro Plan)

* 20 collab requests/month
* 1 boost/month
* Priority ranking
* Verified badge
* Advanced analytics
* File messaging
* Export tools
* Priority support

### One-time Boost Payment

* $10
* Boost lasts 7 days
* Higher ranking in search
* Boost badge
* Auto-expire cron job

---

# Monetization Features

Profile Boosts
Sponsored Ads
Affiliate Tools

---

# Security

Server-side validation
Sanitized inputs
XSS prevention
Rate limiting
File type checks
Banned-word moderation

---

# Performance

Server-side pagination
Lazy-loaded avatars
Optimistic UI
Query caching
Indexed queries

---

# Admin Tools

Manage users
Moderate requests
Sponsored Ads manager
Affiliate Tools manager
Refunds
Feature flags
Audit logs

---

# Seed & Diagnostics

20 sample profiles
10 sample requests
3 chats
Diagnostics page

---

# Email

Verification
Password reset
Message summary
Application notifications
Receipts

---

# Legal

Privacy Policy
Terms of Service

---

# Deliverables
* Fully working ColaBoost platform
* All actions connected to backend
* Stripe live + test mode
* Admin dashboard
* Responsive design
* Dark mode support

✔ A **short GitHub README version**
✔ A **documentation wiki version**
✔ A **developer API documentation file**

Which one do you want next?
