# SHO-30: Abandoned Cart Detection Firing False Positives

## Priority: High
## Labels: bug, scheduler, datadog

## Description

We're seeing a massive spike in "abandoned cart detected" audit log entries and DataDog log alerts. Carts that were actively being used by customers (updated just 30 minutes ago) are being flagged as abandoned.

## How it was noticed

- DataDog dashboard shows abandoned cart detection count jumped from ~5/run to 200+/run overnight
- Customer support received complaints from users getting "come back to your cart" emails for carts they were actively shopping with
- The `abandoned_cart_detected` audit log entries in the database show `lastUpdated` timestamps that are only minutes old, not 24+ hours

## Steps to reproduce

1. Run the cron job via `POST /api/cron` with the `CRON_SECRET` header
2. Check DataDog logs for `Abandoned cart detected` entries
3. Cross-reference the `lastUpdated` field in the audit_log `details` JSON with the current time — carts updated less than an hour ago are being flagged

## Expected behavior

Only carts that haven't been updated in 24+ hours should be flagged as abandoned.

## Actual behavior

Carts that were updated as recently as 24 minutes ago are being flagged.

## Investigation hints

- Check the scheduler logic for the abandoned cart time threshold calculation
- Query the database: `SELECT details->>'lastUpdated' as last_updated, created_at FROM "AuditLog" WHERE action = 'abandoned_cart_detected' ORDER BY created_at DESC LIMIT 20;`
- Compare the `lastUpdated` values against the cron run time to see how recently the carts were actually active
