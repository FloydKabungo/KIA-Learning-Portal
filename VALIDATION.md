# Presentation cleanup verification — 9 October 2026

- Home, Sign Up, Login and all six portal pages checked at 1440px and 390px.
- Display & Comfort appears only inside the top-right dropdown; Escape closes the menu and dialog focus returns correctly.
- All admin and Mompreneur tabs checked for visible demo/sample labels; none remain.
- Removed member-only notice; no standalone footer preference button remains.
- Contact links lead to Sign Up; contact.html redirects to its contact section. Email and phone links work.
- Enrolment validation and the three-step flow work without sending or saving personal details. Login fields remain disabled.
- No JavaScript page errors, horizontal overflow or backend requests during checks. All root JavaScript syntax checks and local HTML links pass.
- Desktop/mobile screenshots reviewed. The public Options dropdown is aligned to the right edge on phones.

Backend status is unchanged: local fictional fixtures only; no live login or form submission.

# Visual learner verification — 8 October 2026

- Home, My Learning, Schedule and Achievements checked at 1440px, 390px and 320px.
- All illustrations load; no horizontal overflow or browser page errors.
- Desktop and mobile screenshots reviewed for all four tabs.
- Account menus, notification controls and display preferences work.
- Module tiles open lesson lists; available lessons and resources open correctly.
- Completed lessons and optional class/milestone details remain accessible.
- Calendar/session views, month navigation and session details work.
- Badge cards, collapsed rankings, ranking filters and ranking visibility work.
- Quiet view and extra-large text checked on the mobile homepage.
- All JavaScript files pass syntax checks; local HTML links resolve.

Testing uses fictional local preview data. Live persistence/authentication and
server-side course access remain future backend work.

# Learner homepage verification — 8 October 2026

- Compared all four learner headers at 1440px, 768px, 390px and 320px: same dimensions, account typography and avatar sizes; four tabs with the correct active state.
- Notification bell visible on desktop and mobile. Popovers fit the viewport; Escape, account switching and outside clicks close them.
- Redesigned homepage has no horizontal overflow at those widths. Desktop and phone screenshots reviewed.
- Homepage progress agrees with My Learning; available lessons, locked-next-block state, resources, resource-library tab and session navigation checked.
- Quiet view and extra-large text checked at phone width.
- Repeated the full portal regression checks below: all passed, no browser page errors.
- All JavaScript syntax checks pass and all local HTML script, style, image and page links resolve.

Presentation remains a local frontend preview, not a production LMS. Backend work is unchanged.

# Frontend verification — 8 October 2026

- All six portal pages: Display & Comfort opens from the account dropdown; closing it restores keyboard focus.
- All portal headers scroll out of view, including the top navigation tabs.
- Admin and Mompreneur tabs render without Learning Groups links, filters, or reports; retired group URLs return to the dashboard.
- Lesson editor supports bold text, paragraphs, headings, lists, HTTPS action buttons, and video sources.
- Saved formatted lesson content survives closing/reopening the editor in the local preview.
- Learner lessons show media above formatted text and action buttons.
- Standalone text resources use the same editor; unsafe HTML, event attributes, and link schemes are stripped.
- Desktop (1440px) and phone (390px) menus fit without horizontal overflow.
- Mobile Exit preview labels remain visible; external-media preview text has readable contrast.
- Browser checks reported no page errors or Firebase/auth network requests.

These checks use fictional, local preview data. Backend persistence and authorization remain to be implemented as described in BACKEND-NEXT-STEPS.md.

# Reset verification — 7 October 2026

- Login fields disabled; localhost preview links available.
- admin tabs render; profile writes disabled.
- mompreneur tabs render; profile writes disabled.
- Learner pages render using fictional fixture, ignoring legacy account storage.
- Public, sign-up and disconnected account pages render.
- Mobile pages fit 390px viewport.
- Hosted dashboard entry redirects to disconnected login.
- No browser page errors or Firebase/Firestore/auth network requests.
- All root JavaScript files passed syntax checks.
- Local HTML links and scripts resolve.
- No Firebase SDK/configuration/auth API references remain in application HTML/JavaScript.
- Future backend rules and reset documentation still name Firebase intentionally.

No live cloud service was called or changed. Tests used fictional sample data only.
