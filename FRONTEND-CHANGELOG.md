# Original learner artwork — 8 October 2026

Replaced all ten learner interface illustration files in Assets/learner with a
cohesive original SVG set: explorer robot, wheeled rover, ultrasonic sensors,
block-coding laptop, robot maze challenge, rocket, class calendar, discovery
medal, idea shield and course trophy. These replace the basic placeholder-style
art on all four learner tabs, including resources, points and ranking avatars.
The vector artwork stays sharp at any size and uses no remote image service.
The official KIA logo, standard control icons and lesson content are retained.

All SVGs parsed successfully. Artwork loaded on all four pages without browser
errors. Desktop pages and the mobile homepage were visually checked.
No backend code or behaviour changed.

# Visual learner section — 8 October 2026

- Redesigned Home, My Learning, Schedule and Achievements with short labels,
  original robotics illustrations and generous clickable cards.
- Home has one next-step action, three picture destinations and compact progress
  and points. Removed the duplicate course, resource and session text sections.
- Course modules use illustrated tiles. Tap a module to open its lessons; locked
  lessons still show their release dates and cannot be opened early.
- Resources use visual cards. Completed lessons remain available to revisit.
- Schedule uses a simple calendar and an illustrated selected-session card.
  Extra session notes are available through Details.
- Achievements use large illustrated badges. Point explanations and club rankings
  are collapsed by default; rankings can still be hidden in Display & Comfort.
- Announcements retain their complete text behind expandable titles.
- No flashing, confetti, timers, sounds or automatic animation were added.
- Quiet view, larger text, reduced motion, keyboard navigation and text labels
  remain available. The existing headers continue to scroll away.

New assets: Assets/learner/*.svg. New stylesheet: learner-visual.css.
Keep the complete KIA folder together. Admin, Mompreneur and backend are unchanged.
These are design choices for the 8–18 audience, not a substitute for feedback
from the learners who will use the portal.

# Learner homepage redesign — 8 October 2026

- Rebuilt the learner homepage with the same typography, grey background, header,
  name/avatar, notification bell, account menu and active tabs as My Learning,
  Schedule and Achievements.
- Added a clear next-step card, progress summary, achievement points, course
  shortcuts, upcoming club sessions, resources and support link. Removed the
  older duplicate image panels and content-type labels.
- Homepage cards read the same local preview progress as My Learning. When
  learners are up to date, the card shows the next release date; when finished,
  it links to completed lessons.
- Unified notification behaviour across all four learner pages, including
  mobile visibility, Escape, outside clicks and closing when a link is chosen.
- Header tabs scroll off-screen. Display & Comfort stays inside the account menu.
- Quiet view hides the decorative homepage image; progress and actions remain.

Files updated: student.html, student-page.css, learning-home.js, the three other
learner HTML headers, portal-refresh.css, learning.js, schedule.js,
achievements.js and learner-announcements.js. New file: learner-navigation.js.
All files belong together in the extracted KIA folder. The backend is unchanged.

# Frontend refinements — 7 October 2026

Latest requested changes, applied after the clean backend reset:

- Removed Learning Groups from Admin and Mompreneur navigation, dashboard links,
  member views, report filters and CSV exports. Removed its forms, actions and
  sample data. Learner pages contain no Learning Groups feature. Branches/clubs
  and their normal course assignments remain.
- Moved Display & Comfort into the top-right account dropdown on all portal
  pages. Added the matching account dropdown to learner pages. Public pages
  have the control in the footer. No floating/page-level settings strip remains.
- All main headers scroll away normally, including mobile navigation.
- Added a text editor for lessons and written resources: bold, italic,
  underline, headings, paragraphs, lists and labelled HTTPS buttons.
- Lesson Studio has Add paragraph, Add button, Add video source and Embed
  content controls alongside media uploads/subtitles. Preview shows the media
  followed by the formatted content. Saved formatting reopens in the editor
  and appears in learner/Mompreneur lesson viewing.
- Rich text is restricted to a small safe element set; unsafe links, scripts,
  inline event handlers and arbitrary HTML are discarded. The future backend
  must perform its own validation.

New file: rich-content.js. Keep it in the same folder as the portal HTML files.
The backend remains disconnected. All saves are local design previews.

# Reset change list — 7 October 2026

Based on KIA_Frontend_Update_2026-10-06.zip.

## Removed files

- `firebase-config.js`
- `firebase-session.js`
- `login-firebase.js`
- `firestore.rules`
- `auth-ui.js`
- `accounts.js`
- `account-pages.js`
- `learner-profile.js`
- `FIREBASE-TEST-SETUP.md`
- `FIREBASE-INTEGRATION-NOTES.txt`

## Reworked

- Login is visibly disabled; no credentials can be submitted.
- Removed SDK imports, cloud configuration and all old login/session/password code.
- Admin and learner screens use local design fixtures only; no authenticated roles are assigned.
- Profile writes, invitations and password activation are disconnected.
- Old account storage is not read or migrated. New design samples use a separate storage namespace.
- Removed the external SDK script allowance from page policies.
- Kept the latest branding, accessibility, sign-up, releases, achievements and lesson editor designs.
- Kept AGENTS.md as the rules for the future rebuild, with current status corrected.

New frontend files: designer-context.js and learner-preview.js.
The original ZIP remains a backup; the new ZIP is the clean working copy.

## 9 October 2026 — presentation cleanup

- Moved contact details into Sign Up; old contact URLs redirect to that section.
- Removed the home member-only notice and visible demo/sample data labels across portals and dialogs.
- Moved public-page Display & Comfort into the top-right Options dropdown; portal account dropdowns remain.
- Preserved disabled login, local-only fixtures and non-sending enrolment behaviour. UI cleanup does not connect or change the backend.
