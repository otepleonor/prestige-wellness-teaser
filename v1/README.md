# Prestige Wellness BGC - Interactive Teaser

Prepared September 9, 2026. Independent concept proposal, not an official or operational booking website.

## What is included

A responsive editorial guest website, an interactive treatment explorer, a simulated booking flow, and a separate operations demonstration at `#studio`. The presentation uses warm ivory, espresso, muted clay, fine serif typography, and crops of the client's supplied Facebook artwork. No fabricated spa interior photography or Google reviews are included.

The separate `Prestige-Wellness-Teaser.html` delivery is a self-contained version with embedded images, CSS, and JavaScript. Open it in a browser that permits local HTML scripts. File previews inside messaging apps may display the document without running its interactions. The editable deployment archive contains the conventional multi-file site.

## Publishing status

The site has been built and tested, but has NOT been published to a public URL. A Netlify connection was offered in the conversation; it was still unconnected at the final check. No external hosting account has been changed and no live reservation capability has been enabled.

The deployment archive has `index.html` at its root, requires no build command, and includes `netlify.toml`. Publish the archive contents as a static site, with the root as the publish directory. There are no secrets, API keys, server dependencies, or package-install steps. Routing is hash-based; a separate SPA rewrite is not required.

## Presentation walkthrough

1. Open the guest page. Explore Restore, Renew, Refine, and Smooth. Use arrow keys within the treatment selector to test keyboard access.
2. Select Reserve a moment. Change massage duration and choose one or two guests. Two-guest bookings require two demo specialists and the Together suite at the same time.
3. Choose a date and a simulated appointment time. The date picker supports up to 60 days ahead and uses Asia/Manila. The evening filter starts at 6 PM.
4. Review the selection and explicitly acknowledge that this is a demo. Completing the flow creates a local fictional record, not an appointment with Prestige.
5. Use View in studio, or Studio demo in the footer. Review reports, reschedule or cancel the new fictional visit, or mark it completed.
6. Explore Guest privileges and try a VIP credit booking. The booking holds a session. Completion redeems it; cancellation releases the hold.
7. In Service catalogue, pause a treatment and return to the guest page. It will no longer appear in the booking selector in this browser.

## Approach review: decisions implemented

### Keep the customer experience focused

The management interface is separate from the guest page. The public-facing experience is not interrupted by a sales pitch for backend software. The operations link is discreetly placed in the footer.

### Editorial, not ornamental

The design uses controlled image crops, large serif typography, fine rules, restrained clay accents, and generous spacing. Selective paper texture references Prestige's supplied creative without covering the entire experience. Motion uses short opacity/position transitions and modest image scaling. Native scrolling is preserved; there is no scroll hijacking, autoplay audio, cursor replacement, bounce animation, or motion dependency.

### Do not present unknown details as verified

The Google share link and direct Facebook page could not be extracted in this environment. This is not a complete Google Business Profile scrape. The prototype does not publish a Google review count, rating, made-up testimonial, unconfirmed discount calculation, or undated introductory offer.

Massage prices and listed contact details are from Philippine Primer's January 6, 2026 feature. Waxing and VIP references come from the client-supplied dated Facebook artwork. Reference labels appear near prices, inside booking, and in the concept notes. These are not confirmed current offers. The published 120-minute Signature price is retained as PHP 2,699, rather than silently rounding it to match another source.

### Consultation is different from procedure booking

The aesthetics flow demonstrates a consultation, not a medical procedure. The 30-minute consultation slot is an illustrative configuration, not a verified business duration. No practitioner credentials, medical results, treatment suitability, or procedure pricing are invented. HydraFacial and body-scrub enquiries do not fabricate a fee or timed booking.

### VIP credits have a lifecycle

The demo tracks available, held, and redeemed massage sessions. Creating a credit booking holds one session. Completing it redeems one; cancellation releases the hold. Package terms, expiration, transfer rules, eligible massage types, and accounting allocation remain unconfirmed. Extra body-scrub and wood-sculpting balances are illustrative displays; their redemption flows are not implemented.

## Implemented functionality

- Responsive homepage and mobile navigation.
- Four-category treatment explorer and full reference menu.
- Duration changes with recalculated reference totals.
- One-guest and two-guest appointment demonstrations.
- Sample specialist preferences, room allocation, opening hours, and 15-minute buffers.
- Philippine-time date handling, unavailable times, and evening filtering.
- Explicitly non-operational confirmation and optional clearly marked demo calendar export.
- Appointment search, filters, rescheduling, completion, and confirmed cancellation.
- Today / last 7 days / last 30 days report filters.
- Revenue charts and service breakdowns calculated from the same synthetic records.
- CSV export of the selected reporting scope or appointment view.
- Demo VIP credit holds, redemption, cancellation release, and balances.
- Local service enable/pause controls and a confirmed reset action.
- Keyboard dialog containment, Escape dismissal, focus restoration, and reduced-motion support.

## Important limits

This is a frontend demonstration, not production software. It does not include authentication, role permissions, a real database, payment processing, notifications, consent collection, medical intake, a customer portal login, third-party calendar synchronization, true staff schedules, audit trails, concurrent booking protection, or business analytics integration.

All guest names and appointments are synthetic. No guest contact, health, or payment details are collected. State uses localStorage when the browser permits it, otherwise it remains in memory. Data resets when a new day begins in Manila or when the reset control is used. Different browsers and origins do not share the same data. A same-origin storage event can refresh a second local demo tab, but this is not server-side synchronization or concurrency control.

The studio view is not password-protected because it contains only synthetic demonstration data. `noindex` and robots directives are included to discourage indexing; they are not access control.

Reference cash revenue includes completed non-credit visits only. It does not pretend a credit redemption is a new payment. Utilization uses 3 fictional specialists, 14 hours per day, and appointment minutes; these are demo assumptions rather than verified staffing or opening patterns. Returning visits means the mix of labeled synthetic visits, not a deduplicated customer-retention measure.

## Assets and fonts

All included image files are crops of the client's supplied Facebook screenshots. They are not high-resolution originals and are not newly generated photographs. Replace them with authorized original brand/interior/treatment assets for an approved launch. The copyright remains with the respective owners; public visibility does not itself grant a redistribution license.

The site references Cormorant Garamond and Manrope via the public Google Fonts stylesheet, with local-system fallbacks. No font files are included or redistributed. The page remains usable if the font requests fail. No analytics or advertising scripts are installed.

## Verification

See `QA.md` and `qa-results.json`. Twenty-five functional checks passed in headless Chromium, including eight guest viewport widths from 320 to 1920 pixels, the four mobile operations views, booking, rescheduling, cancellation, credit lifecycle, chart/report reconciliation, downloads, keyboard behavior, and reduced motion. No JavaScript runtime errors were observed during that test run.

The environment blocked navigation to local HTTP/file URLs, so tests rendered the actual self-contained document directly into Chromium. External fonts were deliberately blocked to verify fallbacks. This is not a hosted-domain, real-network, Safari-device, or production payment test. An actual hosted smoke test remains necessary after deployment.

## Before a production release

Obtain written client approval for branding, imagery, service details, prices, operating hours, staffing, qualifications, package rules, taxes/fees, cancellation policies, and consent/privacy copy. Replace demo storage with a transactional server-side booking and credit ledger. Validate availability on the server, place expiring holds, implement payment webhooks and idempotency, and test simultaneous reservations. Protect operations with authentication and appropriate permissions. Add notifications, audit history, backups, and operational monitoring. These are the proposed next implementation phase, not completed features.
