# Fresh backend build checklist

The old integration was removed on 7 October 2026 at the user’s request.
No live service is connected. Follow AGENTS.md and build one feature at a time.
The localhost design fixtures must never act as authentication or authorization.
Cloud deletion is a separate user task in RESET-GUIDE.md.

## 1. Start with the account model

Create a fresh development project with a new project ID. Rebuild one shared
email/password login using Firebase Authentication only. Authenticated roles
are admin, mompreneur and guardian. Learners are records linked to guardians;
one guardian may have multiple learners. Do not create learner Auth accounts.

Add trusted role/status records, deny-by-default rules, branch/guardian access
checks, and server-side invitations and provisioning. No browser may grant
itself roles or access by changing a fixture or learner ID. Rebuild guardian
learner selection using authorized records. Test this before connecting an
entire dashboard. The former custom password system is removed; do not restore it.

## 2. Connect parent enrolment

- Provide real published club choices for the public form instead of sample choices.
- Implement application submission, server-side validation, abuse controls and a receipt/status response.
- Record guardian authorisation and approved privacy/consent version/timestamps. The current form wording is for KIA review.
- Support several children linked to one guardian identity without duplicate Firebase accounts for the same guardian email.
- Check learner username availability on the server. The front end only catches duplicates within one form.
- Implement the proposed admin review/club-placement step and confirmation/invitation emails. Confirm this approval policy with KIA before enabling live submission.
- Keep unauthorised applicants out of protected learner data. Enforce branch scope and guardian/learner relationships independently of the public club preference.
- The current frontend does not send email, create a live user or collect an online payment.

## 3. Store and enforce global course release plans

- Admin controls duration and opening/closing times for courses, monthly blocks and optional individual lessons.
- Releases apply to everyone assigned to the content, including Mompreneurs. They do not depend on completion, enrolment date, or whether another learner has finished.
- There is no fixed seven-day delay. Admin chooses the interval or exact opening date.
- Interpret the UI's dates in Africa/Johannesburg: opening at 00:00; an optional closing date lasts through that day. Persist reliable timestamps and evaluate using server time.
- Blank closing dates mean catch-up remains available. If a closing date is supplied, decide and communicate the catch-up/access policy with KIA.
- Replace legacy sequential-completion unlocking where it conflicts with the new global schedule. Preserve the separately agreed onboarding prerequisite for Mompreneur facilitation access unless KIA changes it.
- Persist release settings centrally with admin-only writes and trusted audit history. Client clock/storage edits must not unlock protected data or media.
- Enforce the same policy on course content, quizzes, resources and media-delivery URLs. Showing a lock in HTML is not authorization.

## 4. Persist lessons, captions and protected media

Connect the existing frontend lesson/editor model to authenticated storage and Firestore. Support title, media type, body text, formatted bodyHtml, HTTPS button links, video/image asset, image alternative text, WebVTT captions, transcript and quizzes. Validate and sanitise rich content on the trusted server as well as on the client. Retain only the approved text tags and safe link destinations; never trust saved HTML.

Validate media size/type and subtitle content server-side. Configure storage policies, appropriate delivery URLs and access checks. Treat quiz answer keys as server-only where scores affect achievements. Serve only content the signed-in account is allowed to access; check course access as well as branch/guardian permissions.

Learners and Mompreneurs have view access, not asset-library download/export access. Add the approved licence/content-use acknowledgement to the trusted account history. Removing download buttons or adding a copyright notice cannot prevent screen recording or guarantee non-copying. Review any third-party embed provider's privacy and media controls.

## 5. Trusted progress, points and rankings

- Save per-learner progress and best quiz results to the backend.
- Validate completion events and quiz submissions rather than trusting client-reported scores or totals.
- Finalise points with KIA. The current design proposes 10 per lesson, up to 20 per quiz proportional to the best score, and 100 for course completion.
- Award each event once using an idempotent transaction/ledger; refreshes, retries and repeat completions must not duplicate rewards. Quiz retries should grant only a legitimate improvement.
- Calculate club-only completion and quiz rankings. The UI compares lesson counts and average best quiz percentages, with shared ranks for ties and no speed penalties.
- Serve a minimal leaderboard projection using aliases/avatars. Do not send guardian contacts, addresses, birth dates or another club's private records to a learner.
- Preserve the option to hide competition while keeping personal achievements. Keep comparisons within the learner’s club. Learning Groups is not part of the scope.
- Remove unused certificate data/settings/endpoints and dependencies in a deliberate migration; the frontend certificate UI is already removed.

## 6. Keep club calendars and privacy boundaries

Mompreneurs manage their own club sessions, and linked learners view them. The admin portal no longer displays class schedules. Course release management is separate and remains an admin responsibility.

Keep deny-by-default Firestore/Storage rules; enforce account status and trusted ownership/role checks. Implement App Check, rate controls, audit logging, least privilege, backup/recovery and retention/deletion policies as described in the standing rules. Do not loosen rules to make a new screen work.

## 7. Required verification before launch

Test anonymous access, cross-guardian learner access, cross-club Mompreneur access, role/branch manipulation, invitation abuse and disabled accounts. For this release additionally test direct media/quiz access before opening and after closing, client clock tampering, repeated/concurrent point events, quiz score tampering and rankings isolation.

The reset checks exercised the disconnected frontend without SDK mocks: login disabled, local sample pages working, obsolete stored accounts ignored, and no Firebase network requests. They do not establish production readiness. Existing cloud settings were not inspected or changed.
