# Product ratings seem wrong on product detail pages

**Type**: Bug
**Priority**: Medium
**Reported by**: Priya Patel, Product Manager
**Date**: 2026-02-21

## Description
I was reviewing our top-selling products and noticed that the star rating shown on some product pages doesn't match what I'd expect from the reviews. For example, our "Premium Wireless Headphones" has 47 reviews. When I manually averaged all the ratings from the review data export, it came out to 4.2 stars. But the product page shows 3.6 stars.

I checked a few other products with many reviews and the numbers seem off on those too. Products with only a handful of reviews seem to show the correct average. It's the popular products with lots of reviews where the displayed rating is wrong.

This matters because product ratings directly influence purchasing decisions. If a well-reviewed product is showing a lower rating than it deserves, we're losing sales.

## Steps to Reproduce
1. Find a product with more than 10 reviews
2. Manually calculate the average of ALL review ratings
3. Compare to the rating displayed on the product detail page
4. Notice the discrepancy on products with many reviews

## Expected Behavior
The displayed average rating should reflect ALL reviews for that product.

## Actual Behavior
The average rating appears to be calculated from only a subset of the reviews, not all of them. The more reviews a product has, the more inaccurate the displayed rating becomes.

## Impact
Medium — inaccurate ratings mislead customers and may reduce conversion rates on well-reviewed products. Could also lead to customer distrust if they see a low star rating but read mostly positive reviews.
