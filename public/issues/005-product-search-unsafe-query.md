# Product search returns server error on special characters

**Type**: Bug
**Priority**: High
**Reported by**: Sarah Chen, QA Lead
**Date**: 2026-02-15

## Description
While testing the product search feature, I noticed that searching for terms containing apostrophes, quotes, or other special characters causes a 500 Internal Server Error. For example, searching for "women's" or a product with a quote in the name crashes the search entirely.

I also ran this by our security consultant during the quarterly review and they flagged it as a potential injection risk. They recommended we get engineering to look at how search queries are being constructed.

## Steps to Reproduce
1. Go to the products page
2. Use the search bar to search for: `women's jackets`
3. Observe server error
4. Also try: `test" OR 1=1--`
5. Observe different error behavior

## Expected Behavior
Search should handle special characters gracefully, either escaping them properly or returning "no results found."

## Actual Behavior
The search returns a 500 Internal Server Error when the query contains certain special characters like apostrophes or quotes.

## Impact
High — any customer searching for products with common punctuation (like "women's") gets an error page. Also a potential security concern per our security consultant.
