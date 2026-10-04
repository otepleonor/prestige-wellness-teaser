# Prestige Teaser - QA Report

Executed September 9, 2026. Browser: headless Chromium.

**25 checks passed. JavaScript runtime errors observed: 0.**

| Check | Result | Notes |
|---|---|---|
| Initial guest page renders with no JavaScript error | Passed | Passed |
| Guest layout at eight viewport widths | Passed | 320, 360, 390, 768, 820, 1024, 1440, 1920 px; no horizontal overflow |
| Treatment explorer click and arrow-key navigation | Passed | Passed |
| Two-guest booking and duration pricing | Passed | Two distinct staff and shared suite allocated; PHP 5,398 reference total |
| Confirmation explicitly distinguishes demo from real reservation | Passed | Passed |
| Calendar export | Passed | Labelled demo, tentative and transparent |
| Guest booking appears in operations view | Passed | Passed |
| Rescheduling revalidates room, staff, and closing-time buffer | Passed | Passed |
| Cancel workflow requires confirmation and updates data | Passed | Passed |
| VIP booking places a hold without prematurely redeeming a session | Passed | Passed |
| Completing a VIP visit redeems exactly one credit and removes the hold | Passed | Passed |
| Reporting filters and chart totals reconcile | Passed | Today, 7 days, 30 days; excludes cancellations and credit redemptions from cash revenue |
| Filtered report CSV export | Passed | Passed |
| Catalogue pause removes a service from guest booking choices | Passed | Passed |
| Unpriced facial enquiry does not fabricate a fee or appointment | Passed | Passed |
| Escape dismissal restores keyboard focus to opener | Passed | Passed |
| Consultation-first path | Passed | No medical procedure checkout; null fee; explicitly illustrative duration |
| Scheduling invariants | Passed | Opening time, treatment length, reset buffer, staff and room required |
| Native dialog keeps keyboard focus inside booking | Passed | Passed |
| Mobile menu opens, navigates, and closes | Passed | Passed |
| Mobile booking controls | Passed | Native 16px form text prevents Safari focus zoom; no horizontal overflow |
| Reduced-motion preference disables movement and leaves content visible | Passed | Passed |
| All four operations views responsive at 390px | Passed | Passed |
| Reset demo action with confirmation | Passed | Passed |
| JavaScript runtime errors across full test run | Passed | 0 |

## Test boundary

Self-contained document rendered in headless Chromium with page.set_content; navigation/network unavailable in environment. Remote fonts blocked to verify fallback.

No live domain was deployed or tested. Real Safari/iPhone testing, a hosted smoke test, production scheduling, authentication, payments, and notifications remain outside this demonstration. Sixteen-pixel mobile form text was verified in Chromium; actual Safari focus behavior was not device-tested.