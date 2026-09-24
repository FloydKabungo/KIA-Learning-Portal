# KIA Learning Portal Frontend

Responsive frontend prototype for Kids Innovate Africa.

## Pages
- `index.html` – portal landing page
- `contact.html` – KIA contact page
- `login.html` – shared login page with role-aware demo routing
- `student.html` – student portal demo
- `mompreneur.html` – Mompreneur portal demo
- `admin.html` – KIA admin portal demo

## Demo login flow
The role cards on the home page open the shared login page with the intended role selected. Enter any non-empty username/email and password to preview that role's portal. This is frontend-only demo behavior; production authentication should determine the role from the authenticated account, not from the URL or client-side selection.

## Run locally
Open the folder in VS Code and use Live Server on `index.html`.

## v4 visual update
- Hero portrait now preserves the original uploaded image aspect ratio so the learner and robotics kit are visible.
- Colour usage is balanced across KIA blue, yellow and orange.
- Student, Mompreneur and Admin cards each have their own login button and role-specific login routing.

- Footer uses KIA's supplied social icons and real social media links.
