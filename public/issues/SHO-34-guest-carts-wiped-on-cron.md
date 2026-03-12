# SHO-34: Guest Shopping Carts Being Deleted Prematurely by Cron Job

## Priority: Critical
## Labels: bug, scheduler, cart, customer-impact

## Description

Guest users are reporting that their shopping carts are randomly emptied. After investigation, the scheduled cron job that is supposed to clean up guest carts older than 7 days is instead deleting ALL guest carts, including ones created minutes ago.

## How it was noticed

- Spike in customer support tickets: "my cart was emptied"
- DataDog logs from the cron job show `Cleaned up N expired guest carts` with N being much higher than expected (hundreds instead of single digits)
- Database shows cart count for guest users drops to 0 after each cron run:
  ```sql
  SELECT COUNT(*) FROM "Cart" WHERE user_id IS NULL;
  -- Returns 0 immediately after cron, high numbers before
  ```

## Steps to reproduce

1. Create a guest cart by calling `GET /api/cart?sessionId=test-session-123`
2. Add an item to it via `POST /api/cart`
3. Run the cron job via `POST /api/cron`
4. Try to fetch the cart again — it's gone
5. Check DataDog logs for the cleanup count

## Expected behavior

Only guest carts that haven't been updated in 7+ days should be cleaned up.

## Actual behavior

ALL guest carts are deleted on every cron run, regardless of age.

## Impact

Active guest shoppers lose their carts every time the cron job runs. This directly impacts conversion rates and customer experience. If the cron runs hourly, guest carts survive at most 1 hour.

## Investigation hints

- Check the guest cart cleanup query in the scheduler
- The deletion query should have a time-based filter but may be missing it
- Compare the current cleanup query against what the comment says it should do
- Monitor: `SELECT COUNT(*) FROM "Cart" WHERE user_id IS NULL;` before and after a cron run
