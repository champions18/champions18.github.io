"""Notification worker boilerplate for policy expiry reminders.

Usage:
  celery -A notification_worker.celery_app worker --loglevel=info
  celery -A notification_worker.celery_app beat --loglevel=info
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable

import requests
from celery import Celery
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://user:pass@localhost:5432/policy_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
PUSH_API_URL = os.getenv("PUSH_API_URL", "")

celery_app = Celery("notification_worker", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.beat_schedule = {
    "scan-due-notifications-every-5-min": {
        "task": "notification_worker.scan_due_notifications",
        "schedule": 300.0,
    }
}

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


@dataclass
class ScheduledReminder:
    schedule_id: str
    policy_id: str
    user_id: str
    due_at: datetime
    reminder_offset_days: int
    email: str | None
    phone: str | None
    policy_number: str
    provider_name: str
    end_date: datetime
    push_enabled: bool
    sms_enabled: bool
    email_enabled: bool


def fetch_due_reminders(limit: int = 200) -> list[ScheduledReminder]:
    query = text(
        """
        SELECT ns.id AS schedule_id,
               ns.policy_id,
               ns.user_id,
               ns.due_at,
               ns.reminder_offset_days,
               u.email,
               u.phone,
               p.policy_number,
               p.provider_name,
               p.end_date,
               COALESCE(np.push_enabled, TRUE) AS push_enabled,
               COALESCE(np.sms_enabled, FALSE) AS sms_enabled,
               COALESCE(np.email_enabled, TRUE) AS email_enabled
        FROM notification_schedule ns
        JOIN policies p ON p.id = ns.policy_id
        JOIN users u ON u.id = ns.user_id
        LEFT JOIN notification_preferences np ON np.user_id = ns.user_id
        WHERE ns.processed_at IS NULL
          AND ns.due_at <= NOW()
        ORDER BY ns.due_at ASC
        LIMIT :limit
        """
    )

    with engine.begin() as conn:
        rows = conn.execute(query, {"limit": limit}).mappings().all()

    return [ScheduledReminder(**row) for row in rows]


def _idempotency_key(reminder: ScheduledReminder, channel: str) -> str:
    date_part = reminder.due_at.date().isoformat()
    return f"{reminder.policy_id}:{reminder.reminder_offset_days}:{channel}:{date_part}"


def mark_processed(schedule_id: str) -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                UPDATE notification_schedule
                SET processed_at = NOW()
                WHERE id = :schedule_id
                """
            ),
            {"schedule_id": schedule_id},
        )


def record_notification(
    reminder: ScheduledReminder,
    channel: str,
    status: str,
    provider_message_id: str | None = None,
    error_message: str | None = None,
) -> None:
    idem_key = _idempotency_key(reminder, channel)
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO notification_log
                    (schedule_id, policy_id, user_id, channel, status, provider_message_id, error_message, sent_at, idempotency_key)
                VALUES
                    (:schedule_id, :policy_id, :user_id, :channel, :status, :provider_message_id, :error_message,
                     CASE WHEN :status = 'sent' THEN NOW() ELSE NULL END,
                     :idempotency_key)
                ON CONFLICT (idempotency_key) DO NOTHING
                """
            ),
            {
                "schedule_id": reminder.schedule_id,
                "policy_id": reminder.policy_id,
                "user_id": reminder.user_id,
                "channel": channel,
                "status": status,
                "provider_message_id": provider_message_id,
                "error_message": error_message,
                "idempotency_key": idem_key,
            },
        )


def send_sms(reminder: ScheduledReminder) -> tuple[bool, str | None, str | None]:
    if not reminder.phone or not TWILIO_ACCOUNT_SID:
        return False, None, "Missing phone number or Twilio config"

    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    payload = {
        "From": TWILIO_FROM_NUMBER,
        "To": reminder.phone,
        "Body": (
            f"Reminder: Policy {reminder.policy_number} with {reminder.provider_name} "
            f"expires in {reminder.reminder_offset_days} days."
        ),
    }

    response = requests.post(url, data=payload, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN), timeout=10)
    if response.ok:
        sid = response.json().get("sid")
        return True, sid, None
    return False, None, response.text


def send_email(reminder: ScheduledReminder) -> tuple[bool, str | None, str | None]:
    if not reminder.email or not SENDGRID_API_KEY:
        return False, None, "Missing email or SendGrid config"

    url = "https://api.sendgrid.com/v3/mail/send"
    payload = {
        "personalizations": [{"to": [{"email": reminder.email}]}],
        "from": {"email": "noreply@policytracker.app"},
        "subject": f"Policy expiry reminder: {reminder.policy_number}",
        "content": [
            {
                "type": "text/plain",
                "value": (
                    f"Your policy {reminder.policy_number} ({reminder.provider_name}) "
                    f"expires in {reminder.reminder_offset_days} days."
                ),
            }
        ],
    }
    headers = {"Authorization": f"Bearer {SENDGRID_API_KEY}", "Content-Type": "application/json"}

    response = requests.post(url, json=payload, headers=headers, timeout=10)
    if response.status_code in (200, 202):
        return True, "sendgrid-accepted", None
    return False, None, response.text


def send_push(reminder: ScheduledReminder) -> tuple[bool, str | None, str | None]:
    if not PUSH_API_URL:
        return False, None, "Missing push provider URL"

    payload = {
        "user_id": reminder.user_id,
        "title": "Policy expiry reminder",
        "body": (
            f"Policy {reminder.policy_number} expires in {reminder.reminder_offset_days} days."
        ),
        "metadata": {
            "policy_id": reminder.policy_id,
            "schedule_id": reminder.schedule_id,
        },
    }

    response = requests.post(PUSH_API_URL, json=payload, timeout=10)
    if response.ok:
        message_id = response.json().get("message_id", "push-accepted")
        return True, message_id, None
    return False, None, response.text


def dispatch_channels(reminder: ScheduledReminder) -> Iterable[tuple[str, bool, str | None, str | None]]:
    if reminder.push_enabled:
        ok, provider_id, err = send_push(reminder)
        yield "push", ok, provider_id, err

    if reminder.sms_enabled:
        ok, provider_id, err = send_sms(reminder)
        yield "sms", ok, provider_id, err

    if reminder.email_enabled:
        ok, provider_id, err = send_email(reminder)
        yield "email", ok, provider_id, err


@celery_app.task(name="notification_worker.scan_due_notifications", autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def scan_due_notifications() -> dict:
    reminders = fetch_due_reminders()
    sent_count = 0
    failed_count = 0

    for reminder in reminders:
        for channel, ok, provider_id, err in dispatch_channels(reminder):
            if ok:
                record_notification(reminder, channel, "sent", provider_message_id=provider_id)
                sent_count += 1
            else:
                record_notification(reminder, channel, "failed", error_message=err)
                failed_count += 1

        mark_processed(reminder.schedule_id)

    return {
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        "reminders_scanned": len(reminders),
        "sent": sent_count,
        "failed": failed_count,
    }


if __name__ == "__main__":
    # Manual trigger helper for local verification
    result = scan_due_notifications.delay()
    print(f"Queued scan task: {result.id}")
