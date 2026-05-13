# Policy Tracker Mobile App — System Architecture

## 1) Architecture Overview

We will use a **modular monolith + worker** architecture in the first release:

- **Mobile Client (React Native + TypeScript)**
- **Backend API (Python FastAPI)**
- **PostgreSQL** for transactional data
- **Cloud Object Storage (AWS S3-compatible)** for policy documents
- **Notification Worker** (FastAPI background worker process + scheduler)
- **Message Queue / Event Bus** (Redis + RQ or Celery with Redis) for reliable async jobs

This gives fast delivery with clear separation of concerns and an easy migration path to microservices later.

---

## 2) Frontend (React Native) Breakdown

### Key Modules
- **Auth Module**: Signup/login/refresh/logout, secure token storage.
- **Family Module**: CRUD family members.
- **Policy Module**: CRUD policies (insurance/health/vehicle/tax-saving), policy status, premium details.
- **Documents Module**: Upload/download/view policy documents.
- **Notifications Preferences Module**: Enable/disable push/SMS/email channels.

### Technical Structure
- React Navigation for stack/tab flows.
- Zustand or Redux Toolkit for client state.
- React Query (TanStack Query) for API cache + sync.
- Native secure storage:
  - iOS Keychain
  - Android EncryptedSharedPreferences/Keystore
- Firebase Cloud Messaging (FCM) + APNs bridge for push token registration.

### UX Considerations
- Expiry countdown badges (e.g., “15 days left”).
- Filter by member/category/status.
- Offline-friendly draft edits (optional phase 2).

---

## 3) Backend (FastAPI) Breakdown

### Core API Domains
- `/auth`: register/login/refresh/change password.
- `/users`: profile and account settings.
- `/family-members`: CRUD operations.
- `/policies`: CRUD + search/filter + expiry queries.
- `/documents`: pre-signed upload/download URL APIs.
- `/notifications`: preferences, delivery logs, test sends.

### Backend Layers
1. **Router Layer** (FastAPI endpoints)
2. **Service Layer** (business logic)
3. **Repository Layer** (SQLAlchemy queries)
4. **Integration Layer** (Twilio, SendGrid, Push provider, S3)

### Security
- JWT access token + refresh token rotation.
- Row-level authorization (`user_id` scoping for all family/policy data).
- Signed URLs for document upload/download (no public buckets).
- Password hashing using Argon2 or bcrypt.
- Optional TOTP/OTP MFA in later phase.

---

## 4) Database Schema Strategy (PostgreSQL)

### Primary Entities
- `users`
- `family_members`
- `policies`
- `policy_documents`
- `notification_preferences`
- `notification_schedule`
- `notification_log`
- `device_tokens`

### Data Design Notes
- `policies.end_date` indexed for expiry searches.
- notification schedule table stores pending reminders for D-30, D-15, D-3.
- soft delete fields (`deleted_at`) can be added for audit-heavy domains.
- check constraints ensure positive premium values.

---

## 5) Notification Service Infrastructure

### Reminder Model
When a policy is created/updated:
1. Compute reminder dates: `end_date - 30`, `-15`, `-3`.
2. Upsert rows in `notification_schedule`.
3. Scheduler scans for due reminders every 5–10 minutes.
4. For each due reminder, dispatch jobs per enabled channel:
   - Push
   - SMS (Twilio)
   - Email (SendGrid)
5. Write delivery status to `notification_log`.

### Reliability Patterns
- Idempotency key: `policy_id + reminder_offset + channel + due_date`.
- Retry with exponential backoff for temporary provider failures.
- Dead letter queue (DLQ) after max retries.
- Metrics + alerting:
  - reminders due vs sent
  - failure rate per provider
  - queue depth

### Scheduling Options
- **Option A**: Celery Beat + Celery Worker (recommended).
- **Option B**: APScheduler + RQ.
- **Option C**: Cloud-native scheduler (EventBridge / Cloud Scheduler) + queue.

For MVP, Celery + Redis is practical and widely supported.

---

## 6) Deployment Topology

- FastAPI app container (API)
- Worker container (notification jobs)
- Scheduler container (beat)
- PostgreSQL managed instance
- Redis managed instance
- Object storage bucket
- Observability stack (OpenTelemetry + Prometheus/Grafana/Sentry)

Environment separation:
- `dev`, `staging`, `prod`
- Distinct provider credentials per env
- CI/CD with migration gates

---

## 7) Tech Stack Justification

- **React Native**: one codebase for iOS/Android, large ecosystem, strong push/document tooling.
- **FastAPI**: high developer velocity, type hints, async support, clean OpenAPI docs.
- **PostgreSQL**: relational integrity for user-family-policy model + robust indexing/querying.
- **Redis + Celery**: proven async job processing for reminders and external provider retries.
- **Twilio + SendGrid + FCM/APNs**: production-grade multichannel notification stack.

---

## 8) Step-by-Step Implementation Plan

### Phase 1 — Foundation
1. Set up mono-repo or poly-repo structure.
2. Bootstrap React Native app and FastAPI project.
3. Provision Postgres + Redis + S3 bucket.
4. Configure CI (lint/test/build) and env management.

### Phase 2 — Authentication & User Core
1. Implement signup/login/refresh.
2. Add password hashing + token rotation.
3. Add user profile and secure session handling in app.

### Phase 3 — Family & Policy CRUD
1. Create family member endpoints/UI.
2. Create policy endpoints/UI (start date, end date, premium).
3. Add server-side validation and indexing.

### Phase 4 — Document Management
1. Implement S3 pre-signed upload/download APIs.
2. Add upload/view flows in app.
3. Restrict object access by signed URL expiry.

### Phase 5 — Notifications
1. Build `notification_schedule` generation on policy create/update.
2. Add Celery beat scheduler and worker.
3. Integrate Twilio/SendGrid/push providers.
4. Build delivery logging + retries + DLQ behavior.

### Phase 6 — Hardening
1. Rate limiting, audit trails, and security review.
2. Integration tests for reminder workflows.
3. Observability dashboards and alert thresholds.

### Phase 7 — Release
1. Staging UAT.
2. App Store / Play Store release prep.
3. Progressive rollout + incident runbook.
