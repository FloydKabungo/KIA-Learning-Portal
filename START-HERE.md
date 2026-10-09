# KIA — frontend review copy, 9 October 2026

The old Firebase integration and competing browser password system have been
removed. The latest portal design changes remain, including the frontend refinements below. No cloud resource was deleted
by this file update, and no files on your own computer or Git repository were
changed automatically.

## Open the clean copy

1. Extract this ZIP into a NEW folder. Do not merge it straight over an old copy:
   copying a ZIP over a folder will not delete obsolete files.
2. Open the extracted KIA folder using VS Code → File → Open Folder.
3. Open login.html with Live Server (localhost or 127.0.0.1).
4. Login fields are disabled. Use Admin, Mompreneur and Learner links under Explore the portals below the form. They use fictional fixtures,
   not accounts or passwords. All dashboard pages also open directly locally.
5. Read RESET-GUIDE.md to replace the files in your existing Git folder and
   delete the old cloud project.

## What remains

The home page, contact section within Sign Up, enrolment design, grey styling, top navigation,
circular learner cards, display comfort options, lesson editor, course release
controls, achievements/rankings, copyright notice and club schedules remain.
These are frontend previews. Profile creation/editing, password setup, invitations
and real login are disconnected. The enrolment form creates no application.
New design samples use an isolated storage namespace and never load the former
login records. Display preferences may remain in the browser.

The design fixture helper only initializes on localhost/127.0.0.1/[::1]. On a
hosted URL, dashboard entry returns to the disconnected login page. This is a
preview convenience, not an authorization boundary. This ZIP is not a live LMS.

AGENTS.md retains the agreed future security rules; its old implementation-status
claims have been replaced. BACKEND-NEXT-STEPS.md is the rebuild checklist.
FRONTEND-CHANGELOG.md lists removed files. No .git history, service credentials,
cloud configuration, SDK dependencies or deployment rules are included.

## Latest frontend refinements

Learning Groups has been removed. Click the arrow next to the account name or
avatar to open Display & Comfort. The header scrolls off-screen with the page.

To try the content editor locally: Admin → Courses → Manage course → Add/Edit
Lesson. Type in the content box, select words and press B for bold. Add headings,
paragraphs, lists or a button with an HTTPS destination. Use Add video source for
a video URL, or Add video for a local file. Preview and save. Text resources under
Content → Add Content → Write text use the same formatting controls.

## Learner homepage review

Open student.html with Live Server. The learner homepage now matches the other
learner pages. Use the bell for club updates; the name/arrow opens Display &
Comfort and Exit. Check the homepage at desktop and phone widths.
Use the same extracted folder for your presentation so all updated styles and
the new learner-navigation.js are included. Frontend preview data is fictional;
live sign-in, records, submissions and server-enforced permissions still need
the backend rebuild.

## Latest: visual learner pages

Home, My Learning, Schedule and Achievements now use illustrations and short
labels. Tap a module picture to open lessons. Open Details for session notes;
expand the achievement sections only when you want point rules or club rankings.
The new learner-visual.css and Assets/learner folder must be included when
copying the site. Use this complete ZIP rather than mixing earlier versions.

## Original learner artwork

The latest copy includes ten detailed custom illustrations in Assets/learner.
Replace the entire Assets/learner folder when updating your copy. If your browser
still shows the earlier icons, refresh with Ctrl+F5.

## 9 October presentation cleanup

Contact information is now part of Sign Up. Public pages have an Options dropdown
in the top-right corner for Display & Comfort. Portal pages keep those controls
inside their account dropdowns. Visible demo/sample notices and the home
member-only banner have been removed at the user's request. The data is still
fictional and localhost-only; do not enter real learner information. Login and
online enrolment remain disconnected. The approved licence/privacy wording and
backend work listed in BACKEND-NEXT-STEPS.md are still required before launch.
