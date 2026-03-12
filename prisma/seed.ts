import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });


interface IssueTemplate {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low" | "unprioritized";
  labels: string[];
  repo: string;
  sourceUrl?: string;
}

const issues: IssueTemplate[] = [
  // 001 - Inventory not decremented on order
  {
    title: "Inventory not decremented when order is placed",
    description: `We're seeing a major discrepancy between our physical inventory counts and what the system shows. After the last two weeks of fulfilling orders, almost none of the product quantities in the admin panel have changed. I did a manual count of our top 20 SKUs and the system is showing significantly higher inventory than what we actually have on the shelves. We've already had three cases this week where customers ordered items we physically don't have.

## Steps to Reproduce
1. Note the inventory count for any product
2. Place an order that includes that product
3. Check the inventory count for the product after the order is confirmed

## Expected Behavior
The inventory count should decrease by the quantity ordered when a customer successfully places an order.

## Actual Behavior
The inventory count remains unchanged after an order is placed. Products continue to show as "in stock" even after all physical inventory has been sold.

## Impact
Critical — customers are ordering out-of-stock items, leading to fulfillment delays, backorders, and customer complaints. We've had to manually cancel 12 orders this week alone due to inventory we don't actually have. This is damaging customer trust and costing us in refund processing time.`,
    priority: "critical",
    labels: ["bug", "inventory", "orders"],
    repo: "packages/api",
    sourceUrl: "https://github.com/acme/shopflow/issues/101",
  },
  // 002 - Coupon stacking exploit
  {
    title: "Customers able to apply same coupon code multiple times",
    description: `During routine QA testing of the checkout flow, I discovered that applying the same coupon code multiple times increases the discount each time. On the checkout page, clicking "Apply" with the same code repeatedly causes the discount amount to grow with each click. A customer could theoretically reduce their order total to nearly zero by applying a 10% off coupon ten times.

I checked the order that was placed during testing and the server-side total was calculated correctly (single coupon application), but the checkout page displayed a much lower total. This means the customer sees one price at checkout but gets charged a different (higher) amount — which is also a problem.

## Steps to Reproduce
1. Add items to cart totaling $100
2. Go to checkout
3. Enter coupon code "SAVE10" (10% off)
4. Click Apply — discount shows $10
5. Enter the same code again and click Apply — discount now shows $20
6. Repeat — discount increases by $10 each time

## Expected Behavior
Applying the same coupon code a second time should either be rejected with a message like "Coupon already applied" or should replace the existing coupon (no change in discount).

## Actual Behavior
Each application of the same coupon stacks the discount value, showing an ever-increasing discount on the checkout page.

## Impact
Critical — customers could discover this and either (a) get confused by the price discrepancy between checkout display and actual charge, leading to disputes, or (b) exploit it in combination with other issues for financial loss.`,
    priority: "critical",
    labels: ["bug", "coupons", "checkout"],
    repo: "packages/web",
    sourceUrl: "https://github.com/acme/shopflow/issues/102",
  },
  // 003 - Order total rounding mismatch
  {
    title: "Order total off by a penny on some orders",
    description: `We've received several customer emails pointing out that their order total doesn't exactly match the sum of the line items shown in their order confirmation. The discrepancy is always 1-2 cents. It's not happening on every order — seems to depend on the specific dollar amounts involved.

Example from ticket #4821: Customer ordered items totaling $47.93 subtotal, tax showed as $3.83, shipping $5.99. That should be $57.75 but the total charged was $57.76.

Another example from ticket #4835: Subtotal $124.50, tax $9.96, free shipping. Total should be $134.46 but confirmation shows $134.47.

## Steps to Reproduce
Not consistently reproducible — seems to depend on specific order amounts. Happens more often with certain price combinations.

## Expected Behavior
The order total should always exactly equal subtotal + tax + shipping - discount, down to the penny.

## Actual Behavior
On some orders, the total is off by $0.01 or $0.02 compared to the sum of the individual components.

## Impact
Low per-incident but affects customer trust. We've had about 15 support tickets about this in the past month. Some customers suspect we're overcharging them.`,
    priority: "medium",
    labels: ["bug", "orders", "billing"],
    repo: "packages/api",
    sourceUrl: "https://github.com/acme/shopflow/issues/103",
  },
  // 004 - Cancelled orders don't restore inventory
  {
    title: "Cancelled orders don't restore inventory",
    description: `When we cancel an order — whether the customer cancels it themselves or we cancel it from the admin panel — the inventory for those products is not being added back. We've had several situations where a customer cancelled a large order and the items remained "unavailable" even though we physically have them on the shelf.

Last week we had a customer cancel an order with 5 units of SKU WH-2847. Those 5 units are sitting in our warehouse but the system still shows them as sold. I had to manually go into the admin panel and update the inventory count for that product.

## Steps to Reproduce
1. Note inventory count for a product (e.g., 20 units)
2. Place an order containing 3 of that product
3. Cancel the order
4. Check the inventory count — still shows the decremented amount

## Expected Behavior
When an order is cancelled, the inventory should be restored to its pre-order level.

## Actual Behavior
Inventory count does not change when an order is cancelled, regardless of who cancels it.

## Impact
High — leads to phantom out-of-stock situations. Products show as unavailable when we actually have them. Lost sales from customers who can't order items we physically have in stock.`,
    priority: "high",
    labels: ["bug", "inventory", "orders"],
    repo: "packages/api",
    sourceUrl: "https://github.com/acme/shopflow/issues/104",
  },
  // 005 - Product search unsafe query
  {
    title: "Product search returns server error on special characters",
    description: `While testing the product search feature, I noticed that searching for terms containing apostrophes, quotes, or other special characters causes a 500 Internal Server Error. For example, searching for "women's" or a product with a quote in the name crashes the search entirely.

I also ran this by our security consultant during the quarterly review and they flagged it as a potential injection risk.

## Steps to Reproduce
1. Go to the products page
2. Use the search bar to search for: women's jackets
3. Observe server error
4. Also try: test" OR 1=1--
5. Observe different error behavior

## Expected Behavior
Search should handle special characters gracefully, either escaping them properly or returning "no results found."

## Actual Behavior
The search returns a 500 Internal Server Error when the query contains certain special characters like apostrophes or quotes.

## Impact
High — any customer searching for products with common punctuation gets an error page. Also a potential security concern.`,
    priority: "high",
    labels: ["bug", "security", "search"],
    repo: "packages/api",
    sourceUrl: "https://github.com/acme/shopflow/issues/105",
  },
  // 006 - Cart persists after checkout
  {
    title: "Cart still shows items after completing checkout",
    description: `Multiple customers are reporting that after they place an order, their cart still shows the items they just purchased. The cart icon in the navbar still shows a badge with the item count, and clicking on it shows the same items. If they navigate to /checkout again, they see another checkout form with the same items and could theoretically place the same order twice.

One customer actually did place the same order twice because they thought the first one didn't go through when they saw items still in their cart.

## Steps to Reproduce
1. Add items to cart
2. Proceed to checkout
3. Complete the order successfully
4. Notice the cart icon still shows items
5. Navigate to /cart — same items are there

## Expected Behavior
After a successful order, the cart should be completely empty.

## Actual Behavior
Cart retains all items from the just-completed order. Items persist even after page refresh.

## Impact
High — causing duplicate orders, customer confusion, and increased support ticket volume. We've processed 8 duplicate order refunds in the past two weeks.`,
    priority: "high",
    labels: ["bug", "cart", "checkout"],
    repo: "packages/web",
    sourceUrl: "https://github.com/acme/shopflow/issues/106",
  },
  // 007 - Product rating inaccurate
  {
    title: "Product ratings seem wrong on product detail pages",
    description: `The star rating shown on some product pages doesn't match what I'd expect from the reviews. For example, our "Premium Wireless Headphones" has 47 reviews. When I manually averaged all the ratings from the review data export, it came out to 4.2 stars. But the product page shows 3.6 stars.

Products with only a handful of reviews seem to show the correct average. It's the popular products with lots of reviews where the displayed rating is wrong.

## Steps to Reproduce
1. Find a product with more than 10 reviews
2. Manually calculate the average of ALL review ratings
3. Compare to the rating displayed on the product detail page

## Expected Behavior
The displayed average rating should reflect ALL reviews for that product.

## Actual Behavior
The average rating appears to be calculated from only a subset of the reviews, not all of them.

## Impact
Medium — inaccurate ratings mislead customers and may reduce conversion rates on well-reviewed products.`,
    priority: "medium",
    labels: ["bug", "products", "frontend"],
    repo: "packages/web",
    sourceUrl: "https://github.com/acme/shopflow/issues/107",
  },
  // 008 - Order status race condition
  {
    title: "Order status jumps from 'processing' to 'delivered' skipping 'shipped'",
    description: `We've had a few cases where an order's status jumped directly from "processing" to "delivered" without ever going through "shipped." This happened when multiple warehouse staff were working on the same batch of orders.

Lisa was looking at order #SF-8847 and was about to mark it as "shipped." At the same time, I had the same order open on my screen from a few minutes earlier. Lisa updated it to "shipped." Then I updated it to "delivered" from my stale view. The order went straight from "processing" to "delivered" in the system because my update overwrote Lisa's.

## Steps to Reproduce
1. Open the same order on two different browsers/tabs
2. On Browser A, update the order status from "processing" to "shipped"
3. Without refreshing Browser B, update the status to "delivered"
4. The order is now "delivered" without ever being "shipped" in the audit trail

## Expected Behavior
The system should prevent status updates that skip required steps.

## Actual Behavior
Any status update succeeds regardless of the current state, allowing out-of-sequence transitions.

## Impact
Medium — causes confusion in order tracking and incorrect customer notifications. Has happened 4 times in the past month.`,
    priority: "medium",
    labels: ["bug", "orders", "admin"],
    repo: "packages/api",
    sourceUrl: "https://github.com/acme/shopflow/issues/108",
  },
  // 009 - Pagination missing last page
  {
    title: "Last page of products not accessible",
    description: `The pagination doesn't seem right. We have 52 active products and the product listing shows 12 per page. That should be 5 pages (48 + 4), but the pagination only shows 4 pages. The last 4 products are unreachable through the normal product browsing flow.

## Steps to Reproduce
1. Go to /products
2. Note total products shown (e.g., "52 products found")
3. Navigate through the pagination — only 4 pages are available
4. 4 pages x 12 products = 48 products accessible

## Expected Behavior
With 52 products and 12 per page, there should be 5 pages of products.

## Actual Behavior
Only 4 pages are available. Products that would appear on page 5 are inaccessible through browsing.

## Impact
Medium — some products are effectively invisible to customers browsing the catalog.`,
    priority: "medium",
    labels: ["bug", "products", "frontend"],
    repo: "packages/web",
    sourceUrl: "https://github.com/acme/shopflow/issues/109",
  },
  // 010 - Expired coupons still accepted
  {
    title: "Expired coupon codes still being accepted",
    description: `We ran a promotional campaign with coupon code "WINTER25" that was supposed to expire on February 28th. However, we received orders on March 1st that still used this coupon successfully. It seems like the coupon continued working for several hours past its expiration date.

This has happened before with our "NEWYEAR15" campaign too.

## Steps to Reproduce
1. Create a coupon with an expiration date of today
2. Wait until after midnight (the next day)
3. Try to apply the coupon — it still works for some hours after it should have expired

## Expected Behavior
A coupon should stop working immediately at midnight on its expiration date.

## Actual Behavior
Expired coupons continue to be accepted for several hours past their expiration date.

## Impact
Medium — undermines time-limited promotions and causes small but recurring financial losses on expired discounts.`,
    priority: "medium",
    labels: ["bug", "coupons"],
    repo: "packages/api",
    sourceUrl: "https://github.com/acme/shopflow/issues/110",
  },
  // 011 - Stale sale banner flag
  {
    title: "Remove old homepage hero section behind SALE_BANNER flag",
    description: `The SALE_BANNER feature flag has been permanently enabled since November. The old homepage hero section still exists in the code behind the else branch, and there's a HeroBannerClassic component that was the original banner before we added the sale promotion. Neither the else branch nor the HeroBannerClassic component can ever be reached since the flag is always true.

We should clean up the dead code path and either remove the flag check entirely or remove the old fallback code. The HeroBannerClassic component file can also be deleted since nothing imports it.

## Impact
Low — no user-facing impact. Just dead code that adds confusion for developers working on the homepage.`,
    priority: "low",
    labels: ["tech-debt", "frontend"],
    repo: "packages/web",
  },
  // 012 - Stale product recommendations flag
  {
    title: "Clean up PRODUCT_RECOMMENDATIONS feature flag dead code",
    description: `The PRODUCT_RECOMMENDATIONS flag has been enabled since launch. The product detail page still has a fallback branch that calls a getRandomProducts() function when the flag is disabled. Since the flag is always enabled, this code path is dead and the random products function is never actually called.

We should remove the else branch and the unused getRandomProducts function to simplify the code.

## Impact
Low — dead code that clutters the product detail page implementation.`,
    priority: "low",
    labels: ["tech-debt", "frontend"],
    repo: "packages/web",
  },
  // 013 - Stale inventory alerts flag
  {
    title: "Clean up INVENTORY_ALERTS feature flag dead code",
    description: `The INVENTORY_ALERTS feature flag has been enabled for months. The product detail page has an else branch that shows a basic "unavailable" message when inventory alerts are disabled. Since the flag is always on, this branch is unreachable.

The ProductCard component also checks this flag for its low-stock warning. Should clean up both locations.

## Impact
Low — dead code path. No user-facing impact.`,
    priority: "low",
    labels: ["tech-debt", "frontend"],
    repo: "packages/web",
  },
  // 014 - Dead utility functions
  {
    title: "Remove unused legacy integration functions",
    description: `There's a legacy.ts file in the lib directory containing utility functions for integrations we never shipped: ShipStation order formatting, Shopify inventory sync, Mailchimp email payloads, QuickBooks invoice conversion, packing slip generation, and shipping weight calculation.

These were written during the initial build when we planned to integrate with these services, but we ended up going a different direction. The functions are exported but none of them are actually called anywhere in the application.

We should delete this file entirely or at least remove the unused functions. They add to bundle size and create a false impression that we have these integrations.

## Impact
Low — unused code that increases bundle size and confuses new developers who think these integrations exist.`,
    priority: "low",
    labels: ["tech-debt"],
    repo: "packages/shared",
  },
  // 015 - Unused v1 API route
  {
    title: "Remove orphaned /api/v1/products endpoint",
    description: `While doing an audit of our API endpoints, I found a /api/v1/products route that returns product data in a different format than our main /api/products endpoint. It wraps results in a { data: [], meta: {} } structure instead of the flat structure used by the main endpoint.

No page or component in the frontend references this v1 endpoint. It appears to be a leftover from an earlier API design that was abandoned. It's publicly accessible and returns real product data, but nothing uses it.

We should remove it to reduce our API surface area and avoid confusion about which endpoint is the "real" one.

## Impact
Low — unused endpoint that could cause confusion. Minor security concern of having an undocumented public API returning data.`,
    priority: "low",
    labels: ["tech-debt", "api", "security"],
    repo: "packages/api",
  },
  // 016 - Orphaned components
  {
    title: "Remove orphaned OldCheckoutForm and ProductQuickView components",
    description: `We have two components that are fully built out but never rendered anywhere:

1. OldCheckoutForm — the original multi-step checkout form before we switched to the current single-page layout. Includes a 3-step wizard (Information, Shipping, Payment) with unused credit card fields.

2. ProductQuickView — A modal-based quick view for products that was planned for the product listing page but was deprioritized. There's an unused import of it in the products listing page.

Both should be deleted to reduce codebase clutter.

## Impact
Low — dead code that adds confusion. The unused import may trigger linting warnings.`,
    priority: "low",
    labels: ["tech-debt", "frontend"],
    repo: "packages/web",
  },
  // 017 - Guest checkout
  {
    title: "Allow guest checkout without account creation",
    description: `We're seeing a significant drop-off at the checkout step. Analytics show that 34% of users who add items to their cart abandon when they're redirected to the login page. Many of these are first-time visitors who don't want to create an account just to make a purchase.

The GUEST_CHECKOUT feature flag already exists in our config, but nothing is actually wired up behind it. When we enable the flag, nothing changes — unauthenticated users are still redirected away from /checkout by the middleware.

We need to implement a full guest checkout flow:
- Allow unauthenticated users to access the checkout page
- Collect email address as part of the checkout form for order confirmation
- Associate the order with the session rather than a user account
- Optionally offer "create an account" after purchase with a pre-filled form

This is our most requested feature from customer feedback surveys and the #1 thing our competitors offer that we don't.

## Expected Behavior
Customers should be able to purchase items without creating an account.

## Impact
High — estimated 15-20% increase in conversion rate based on industry benchmarks. Currently losing ~34% of potential customers at the authentication wall.`,
    priority: "high",
    labels: ["feature", "checkout", "auth"],
    repo: "packages/web",
    sourceUrl: "https://github.com/acme/shopflow/issues/117",
  },
  // 018 - Wishlist
  {
    title: "Implement wishlist / save for later",
    description: `We've had 23 customer support requests in the past two months asking about a "save for later" or "wishlist" feature. The WISHLIST feature flag exists in our configuration but the feature has not been implemented at all. There's no database table, no API endpoints, and no UI for it.

Customers are currently working around this by adding items to their cart and just not checking out, which inflates our cart metrics.

Requested functionality:
- Heart/bookmark icon on product cards and product detail page
- Dedicated "My Wishlist" page accessible from the navbar
- Ability to move items from wishlist to cart
- Persist wishlist across sessions (requires login)

## Expected Behavior
Logged-in customers can save products to a wishlist and view/manage them from a dedicated page.

## Impact
Medium — improves customer experience and engagement. Reduces cart abandonment from users using the cart as a wishlist.`,
    priority: "medium",
    labels: ["feature", "frontend"],
    repo: "packages/web",
    sourceUrl: "https://github.com/acme/shopflow/issues/118",
  },
  // 019 - Order tracking page
  {
    title: "Public order tracking page",
    description: `Customers frequently contact support asking "where's my order?" Currently, the only way to check order status is to log into their account and go to the orders page.

We need a public tracking page at /track where customers can enter their order number and email address to see their order status, tracking number, and estimated delivery without needing to log in.

Requirements:
- Public page (no auth required) at /track
- Form with order number and email address fields
- Shows: order status, items ordered, tracking number (if available), estimated delivery
- Clean, branded design consistent with the rest of the site
- Rate-limited to prevent enumeration

## Expected Behavior
Anyone with an order number and the associated email can look up their order status on a public page.

## Impact
Medium — reduces "where's my order?" support tickets (currently ~30% of all support volume).`,
    priority: "medium",
    labels: ["feature", "orders", "frontend"],
    repo: "packages/web",
    sourceUrl: "https://github.com/acme/shopflow/issues/119",
  },
  // 020 - Product image gallery
  {
    title: "Multiple product images with gallery view",
    description: `Currently each product only supports a single image_url. This is a significant limitation — customers want to see products from multiple angles. Our return rate is 18% and customer feedback consistently mentions "product didn't look like the photo" as a reason.

We need to support multiple images per product:
- Database: New ProductImage table (or JSON array on Product) to store multiple image URLs with sort order
- Admin: Ability to upload/manage multiple images per product
- Product detail page: Thumbnail carousel or gallery with a main image that changes on click/hover
- Product cards: Could show second image on hover (nice to have)

Competitors typically show 4-6 images per product. Our merchandising team already has additional product photos ready to upload once the feature is built.

## Expected Behavior
Each product can have multiple images displayed in a gallery with thumbnails on the product detail page.

## Impact
Medium — expected to reduce return rate and increase conversion. Merchandising team is blocked on uploading additional product photography.`,
    priority: "medium",
    labels: ["feature", "products", "frontend"],
    repo: "packages/web",
    sourceUrl: "https://github.com/acme/shopflow/issues/120",
  },
  // 021 - Bulk inventory update
  {
    title: "Bulk inventory update via CSV upload",
    description: `Right now, to update inventory counts, I have to go into the admin panel, find each product individually, click edit, change the count, and save. When we get a shipment of 50+ SKUs, this takes me over an hour.

I need a CSV upload tool in the admin panel where I can:
1. Download a CSV template with current inventory (columns: SKU, Product Name, Current Count, New Count)
2. Fill in the "New Count" column for the items that changed
3. Upload the CSV and have the system update all inventory counts at once
4. See a preview/confirmation of changes before they're applied
5. Get a summary of what was updated after it's done

## Expected Behavior
Admin/warehouse users can upload a CSV file to update inventory counts for multiple products at once, with preview and confirmation.

## Impact
High — warehouse staff spend 5+ hours per week on manual inventory updates. This is error-prone and takes time away from actual warehouse operations.`,
    priority: "high",
    labels: ["feature", "admin", "inventory"],
    repo: "packages/admin",
    sourceUrl: "https://github.com/acme/shopflow/issues/121",
  },
  // 022 - Email notifications
  {
    title: "Order email notifications (confirmation, shipping, delivery)",
    description: `We currently send zero transactional emails. When a customer places an order, they see a confirmation page but receive no email confirmation. When we ship their order, they have no way to know unless they manually check their order status on the website.

We need to implement at minimum these three email notifications:
1. Order Confirmation — sent immediately when an order is placed
2. Shipping Notification — sent when an order status changes to "shipped"
3. Delivery Confirmation — sent when an order status changes to "delivered"

Nice to have (phase 2):
- Order cancellation confirmation
- Review request (3 days after delivery)
- Branded HTML email templates

## Expected Behavior
Customers receive email notifications at key order milestones: confirmation, shipping, and delivery.

## Impact
High — this is table-stakes e-commerce functionality. Lack of order confirmation emails generates ~20 support tickets per week.`,
    priority: "high",
    labels: ["feature", "notifications", "orders"],
    repo: "packages/notifications",
    sourceUrl: "https://github.com/acme/shopflow/issues/122",
  },
  // SHO-30 - Abandoned cart false positives
  {
    title: "Abandoned cart detection firing false positives",
    description: `We're seeing a massive spike in "abandoned cart detected" audit log entries and DataDog log alerts. Carts that were actively being used by customers (updated just 30 minutes ago) are being flagged as abandoned.

## How it was noticed
- DataDog dashboard shows abandoned cart detection count jumped from ~5/run to 200+/run overnight
- Customer support received complaints from users getting "come back to your cart" emails for carts they were actively shopping with
- The abandoned_cart_detected audit log entries show lastUpdated timestamps that are only minutes old

## Steps to Reproduce
1. Run the cron job via POST /api/cron with the CRON_SECRET header
2. Check DataDog logs for Abandoned cart detected entries
3. Cross-reference the lastUpdated field with the current time — carts updated less than an hour ago are being flagged

## Expected Behavior
Only carts that haven't been updated in 24+ hours should be flagged as abandoned.

## Actual Behavior
Carts that were updated as recently as 24 minutes ago are being flagged.

## Investigation hints
- Check the scheduler logic for the abandoned cart time threshold calculation`,
    priority: "high",
    labels: ["bug", "scheduler", "datadog"],
    repo: "packages/worker",
    sourceUrl: "https://github.com/acme/shopflow/issues/130",
  },
  // SHO-31 - Order totals missing tax
  {
    title: "Order totals don't match expected amounts — tax not included",
    description: `Finance team flagged that order totals in the database are consistently lower than expected. The stored total on orders does not include the tax_amount, even though tax is being calculated and stored in its own column correctly.

## How it was noticed
- Finance reconciliation script flagged discrepancies for all recent orders
- DataDog APM traces show the order creation endpoint returning totals that are ~8% lower than expected
- Customers are being charged less than they should be (the total field is what gets sent to payment processing)

## Steps to Reproduce
1. Create an order via POST /api/orders with a cart containing items
2. Query the created order and notice that total != expected_total — the difference is exactly the tax_amount

## Expected Behavior
total = (subtotal - discount) + tax_amount + shipping_cost

## Actual Behavior
total = (subtotal - discount) + shipping_cost (tax is missing from the total)

## Impact
Every order placed is being undercharged by 8% (the tax rate). This is a revenue leak and a tax compliance issue.`,
    priority: "critical",
    labels: ["bug", "orders", "payments", "data-integrity"],
    repo: "packages/api",
    sourceUrl: "https://github.com/acme/shopflow/issues/131",
  },
  // SHO-32 - Admin revenue inflated by refunds
  {
    title: "Admin dashboard revenue includes refunded orders",
    description: `The admin dashboard's total revenue figure is inflated because it includes refunded orders in the revenue calculation. This gives leadership an inaccurate picture of actual revenue.

## How it was noticed
- Product manager noticed the dashboard revenue didn't match the finance team's numbers
- DataDog custom metric for shopflow.revenue.total is consistently higher than the payment processor's net revenue
- Querying the database confirms refunded orders are being summed into the total

## Steps to Reproduce
1. Log in as admin and visit the dashboard, note the total revenue
2. Query actual revenue excluding refunds
3. The dashboard shows inflated revenue that includes refunded orders

## Expected Behavior
Revenue calculation should only include orders with status: delivered, shipped, processing.

## Actual Behavior
Revenue calculation also includes refunded orders, inflating the total.

## Investigation hints
- Check the admin stats API route's revenue aggregation query`,
    priority: "high",
    labels: ["bug", "admin", "reporting", "data-integrity"],
    repo: "packages/admin",
    sourceUrl: "https://github.com/acme/shopflow/issues/132",
  },
  // SHO-33 - Coupon minimum order bypass
  {
    title: "Coupons with minimum order threshold can be applied to small orders",
    description: `Coupons that have a minimum_order requirement (e.g., FLAT20 requires $100 minimum) are being successfully applied to carts well below the minimum threshold. The validation check appears to be comparing against the wrong value.

## How it was noticed
- DataDog logs show successful coupon validation for the FLAT20 coupon (min $100) on carts with totals of $25-$50
- Marketing team noticed coupon redemption rates for FLAT20 were 4x higher than projected
- Database query shows orders with FLAT20 discount applied where subtotal < $100

## Steps to Reproduce
1. Add items to cart totaling $25
2. Apply coupon code FLAT20 via POST /api/cart/coupon
3. The coupon is accepted and a $20 discount is returned
4. It should have been rejected with "Minimum order of $100 required"

## Expected Behavior
Coupon validation should reject coupons when cartTotal < minimum_order.

## Actual Behavior
The validation compares cartTotal against the coupon's discount_value instead of minimum_order.

## Impact
Revenue loss from discounts being applied to orders that don't meet the minimum threshold.`,
    priority: "high",
    labels: ["bug", "coupons", "cart", "revenue-loss"],
    repo: "packages/api",
    sourceUrl: "https://github.com/acme/shopflow/issues/133",
  },
  // SHO-34 - Guest carts wiped on cron
  {
    title: "Guest shopping carts being deleted prematurely by cron job",
    description: `Guest users are reporting that their shopping carts are randomly emptied. After investigation, the scheduled cron job that is supposed to clean up guest carts older than 7 days is instead deleting ALL guest carts, including ones created minutes ago.

## How it was noticed
- Spike in customer support tickets: "my cart was emptied"
- DataDog logs from the cron job show Cleaned up N expired guest carts with N being much higher than expected (hundreds instead of single digits)
- Database shows cart count for guest users drops to 0 after each cron run

## Steps to Reproduce
1. Create a guest cart by calling GET /api/cart?sessionId=test-session-123
2. Add an item to it via POST /api/cart
3. Run the cron job via POST /api/cron
4. Try to fetch the cart again — it's gone

## Expected Behavior
Only guest carts that haven't been updated in 7+ days should be cleaned up.

## Actual Behavior
ALL guest carts are deleted on every cron run, regardless of age.

## Impact
Active guest shoppers lose their carts every time the cron job runs. This directly impacts conversion rates and customer experience.

## Investigation hints
- Check the guest cart cleanup query in the scheduler
- The deletion query should have a time-based filter but may be missing it`,
    priority: "critical",
    labels: ["bug", "scheduler", "cart", "customer-impact"],
    repo: "packages/worker",
    sourceUrl: "https://github.com/acme/shopflow/issues/134",
  },
];

function randomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date;
}


async function main() {
  // Clear existing data
  await prisma.activityEvent.deleteMany();
  await prisma.scopingReport.deleteMany();
  await prisma.issue.deleteMany();

  const createdIssues = [];

  for (let i = 0; i < issues.length; i++) {
    const template = issues[i];
    const createdAt = randomDate(120);
    const status = "untriaged";
    const complexity = "unknown";
    const assignee: string | null = null;
    const updatedAt = createdAt;

    const issue = await prisma.issue.create({
      data: {
        title: template.title,
        description: template.description,
        status,
        priority: "unprioritized",
        complexity,
        repo: "unknown",
        labels: JSON.stringify(template.labels),
        assignee,
        sourceUrl: template.sourceUrl || null,
        createdAt,
        updatedAt,
      },
    });
    createdIssues.push(issue);

    // Create activity events for all issues
    await prisma.activityEvent.create({
      data: {
        issueId: issue.id,
        eventType: "status_change",
        actor: "system",
        message: `Issue created with status untriaged`,
        metadata: JSON.stringify({ from: null, to: "untriaged" }),
        createdAt,
      },
    });

  }

  const count = await prisma.issue.count();
  console.log(`Seeded ${count} issues from public/issues markdown files`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
