# Public order tracking page

**Type**: Feature Request
**Priority**: Medium
**Reported by**: Angela Torres, Marketing Manager
**Date**: 2026-01-20

## Description
Customers frequently contact support asking "where's my order?" Currently, the only way to check order status is to log into their account and go to the orders page. Customers who forgot their password or who checked out as a guest (once we implement that) have no self-service option.

We need a public tracking page at `/track` where customers can enter their order number and email address to see their order status, tracking number, and estimated delivery without needing to log in.

This would also be useful for the shipping confirmation emails we plan to send — we can include a direct link to the tracking page.

Requirements:
- Public page (no auth required) at /track
- Form with order number and email address fields
- Shows: order status, items ordered, tracking number (if available), estimated delivery
- Clean, branded design consistent with the rest of the site
- Rate-limited to prevent enumeration

## Expected Behavior
Anyone with an order number and the associated email can look up their order status on a public page.

## Impact
Medium — reduces "where's my order?" support tickets (currently ~30% of all support volume). Improves customer experience and sets us up for email notification links.
