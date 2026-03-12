# Order email notifications (confirmation, shipping, delivery)

**Type**: Feature Request
**Priority**: High
**Reported by**: Angela Torres, Marketing Manager
**Date**: 2026-02-20

## Description
We currently send zero transactional emails. When a customer places an order, they see a confirmation page but receive no email confirmation. When we ship their order, they have no way to know unless they manually check their order status on the website. This is a fundamental gap in our customer experience.

We need to implement at minimum these three email notifications:
1. **Order Confirmation** — sent immediately when an order is placed, including order number, items, total, shipping address, and estimated delivery
2. **Shipping Notification** — sent when an order status changes to "shipped," including tracking number and carrier link
3. **Delivery Confirmation** — sent when an order status changes to "delivered"

Nice to have (phase 2):
- Order cancellation confirmation
- Review request (3 days after delivery)
- Branded HTML email templates

We'll need to integrate an email service (SendGrid, Resend, AWS SES, etc.) and create email templates. The trigger points already exist in our order status flow — we just need to hook into them.

## Expected Behavior
Customers receive email notifications at key order milestones: confirmation, shipping, and delivery.

## Impact
High — this is table-stakes e-commerce functionality. Lack of order confirmation emails generates ~20 support tickets per week from customers who aren't sure their order went through. Shipping notifications are the #2 most requested feature after guest checkout.
