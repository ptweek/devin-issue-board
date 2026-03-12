# Remove old homepage hero section behind SALE_BANNER flag

**Type**: Tech Debt
**Priority**: Low
**Reported by**: James Liu, Senior Developer
**Date**: 2026-01-28

## Description
The SALE_BANNER feature flag has been permanently enabled since November. The old homepage hero section still exists in the code behind the `else` branch, and there's a `HeroBannerClassic` component that was the original banner before we added the sale promotion. Neither the else branch nor the HeroBannerClassic component can ever be reached since the flag is always `true`.

We should clean up the dead code path and either remove the flag check entirely (hardcoding the sale banner) or remove the old fallback code. The HeroBannerClassic component file can also be deleted since nothing imports it.

## Impact
Low — no user-facing impact. Just dead code that adds confusion for developers working on the homepage.
