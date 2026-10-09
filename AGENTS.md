# KIA project instructions

The user’s standing backend rules are retained below for the fresh rebuild.
The 7 October 2026 reset supersedes old implementation-status notes.
Preserve the existing frontend design.

# KIA Firebase Backend AI Rules — v2

Use this file as the standing instruction set for any AI working on the Kids Innovate Africa (KIA) portal backend.

## 1. System architecture

This project uses Firebase, not Supabase.

Primary services:
- Firebase Authentication for login, password handling, sessions, password reset, and account identity.
- Cloud Firestore for application data.
- Firebase Security Rules for database access control.
- Firebase App Check for abuse/app-origin protection where supported.
- Cloud Functions / Firebase Admin SDK for privileged server-side actions.
- Firebase Hosting or another HTTPS host for the frontend.

Do not introduce Supabase, PostgreSQL, Row Level Security, `auth.uid()`, `service_role`, or Supabase-specific APIs into this project unless the project architecture is intentionally changed later.

## 2. Account types

There are exactly three authenticated account roles:
- `admin`
- `mompreneur`
- `guardian`

A learner is NOT an authentication account.

A learner is a Firestore record. A guardian authenticates and accesses the learner portal for the learner(s) linked to that guardian.

One guardian account may be linked to multiple learners.

## 3. One login page

There is one login page using:
- email
- password

Firebase Authentication verifies the credentials.

After authentication, the app reads the authenticated user's trusted user/role record and determines the portal:
- `admin` -> Admin Dashboard
- `mompreneur` -> Mompreneur Dashboard
- `guardian` -> Guardian/Learner Portal

Do not use email-address comparisons, hidden buttons, frontend route checks, or browser-controlled values as the security boundary.

## 4. Password security

Never build a custom password database.

Never store passwords in Firestore, browser storage, logs, analytics, audit logs, source files, or custom profile documents.

Use Firebase Authentication for password handling.

Never display, retrieve, log, email, or return a user's existing password.

Users create or reset their own password through approved Firebase Authentication flows.

## 5. Roles and trusted authorization

Roles must be stored in trusted backend-managed data and/or secure Firebase custom claims.

A normal browser user must never be able to change:
- their role
- their account status
- their branch authorization
- another user's permissions

Sensitive role assignment must happen only through trusted server-side code using the Firebase Admin SDK.

Current Firestore user records may use a structure like:

`users/{uid}`
- `role`
- `status`
- `branchId` when applicable
- `createdAt`
- `updatedAt`

Browser writes to role/status fields must be denied by Security Rules.

## 6. Account creation flow

### Admin -> Mompreneur

The Admin creates a Mompreneur profile.

The Mompreneur must receive an invitation/onboarding email and create their own password.

The Admin must never see or choose the Mompreneur's password.

The privileged account-creation operation must happen through trusted server-side code such as Cloud Functions using the Firebase Admin SDK.

After activation:
- role = `mompreneur`
- status = `active`

### Mompreneur -> Learner + Guardian

A Mompreneur may create learners only for their authorized branch.

The Mompreneur enters learner details:
- full name
- username
- date of birth
- gender
- home address
- branch/club association

Guardian details:
- full name
- email address
- cellphone number

The backend must determine the Mompreneur's authorized branch from trusted authenticated data.

Do not trust a browser-supplied `branchId` for authorization.

If a guardian account already exists, link the learner to that guardian instead of creating another Firebase Authentication account for the same person.

A guardian may be linked to multiple learners.

## 7. Data model

Use Firestore collections structured around the application's permission boundaries.

Recommended collections:

### `users/{uid}`
Authentication-linked account record.
Possible fields:
- `role`
- `status`
- `branchId`
- `createdAt`
- `updatedAt`

### `branches/{branchId}`
Possible fields:
- `name`
- `status`
- `createdAt`
- `updatedAt`

### `mompreneurs/{uid}`
Possible fields:
- `fullName`
- `cellphone`
- `branchId`
- `createdAt`
- `updatedAt`

### `guardians/{uid}`
Possible fields:
- `fullName`
- `email`
- `cellphone`
- `createdAt`
- `updatedAt`

### `learners/{learnerId}`
Possible fields:
- `fullName`
- `username`
- `gender`
- `branchId`
- `createdBy`
- `createdAt`
- `updatedAt`

### `learnerPrivate/{learnerId}`
Use for more sensitive information where separating documents improves access control.
Possible fields:
- `dateOfBirth`
- `homeAddress`

### `guardianLearners/{relationshipId}`
Possible fields:
- `guardianId`
- `learnerId`
- `relationshipType`
- `createdAt`

### `guardianConsents/{consentId}`
Possible fields:
- `guardianId`
- `learnerId`
- `consentStatus`
- `consentVersion`
- `consentedAt`
- `createdAt`

### `auditLogs/{logId}`
Possible fields:
- `actorUid`
- `action`
- `targetType`
- `targetId`
- minimal non-sensitive metadata
- `createdAt`

Never store passwords in Firestore.

## 8. Data minimization

Only collect information KIA actually needs.

Learner information currently required:
- full name
- username
- date of birth
- gender
- home address
- branch/club

Guardian information:
- full name
- email
- cellphone number

Do not add extra personal information unless the application has a clear requirement.

## 9. Sensitive child information

Treat learner information as highly sensitive application data, especially the combination of:
- child name
- date of birth
- gender
- home address
- guardian contact information

Do not return these fields to screens that do not need them.

Do not place all sensitive information in one document if different permissions are needed for different groups of fields.

Firestore Security Rules operate at the document level. If a user can read a document, they can read the fields in that document. Separate sensitive documents when needed.

## 10. Firestore Security Rules

Security Rules must deny access by default.

Never use production rules equivalent to:
`allow read, write: if true;`

Every collection must explicitly define who may:
- read
- create
- update
- delete

Rules must use the authenticated Firebase identity:
`request.auth.uid`

Security must not depend only on frontend JavaScript.

### Expected permissions

Admin:
- may perform authorized platform management operations
- may manage branches
- may manage Mompreneurs
- may view authorized records
- may view audit information
- must still be subject to explicit Security Rules or trusted server-side Admin SDK logic

Mompreneur:
- may access their own profile
- may access only their assigned branch
- may create/manage learners only for their authorized branch
- must not access other branches' protected learner data
- must not change roles or system-wide permissions

Guardian:
- may access their own profile
- may access only learners linked to that guardian
- must not access other guardians' learners
- must not access Admin or Mompreneur functionality

## 11. Do not trust the frontend

Never trust browser-supplied authorization values such as:
- `role`
- `uid`
- `admin`
- `branchId`
- `guardianId`
- `learnerId`
- `ownerId`
- permissions

The browser is untrusted.

Security Rules and/or trusted server-side code must independently verify every protected operation.

Changing an ID in the browser must never expose another person's data.

## 12. Privileged Firebase Admin operations

Use the Firebase Admin SDK only in trusted server-side environments.

Never put service-account private keys or Admin credentials in:
- frontend JavaScript
- HTML
- GitHub
- browser local storage
- screenshots
- public `.env` files

Normal Firebase web configuration is not the same as Firebase Admin credentials.

Never place a service-account JSON file in the public website directory.

## 13. Cloud Functions

Use Cloud Functions for privileged operations such as:
- creating invited user accounts
- assigning roles/custom claims
- disabling users
- sensitive administrative workflows
- trusted audit logging
- server-side validation that must not be bypassed

Cloud Functions must verify:
- authentication
- authorization
- account status
- branch ownership where relevant
- input shape and allowed values

Do not trust a callable function request simply because it came from the website.

## 14. Firebase App Check

Enable Firebase App Check for production where supported.

App Check is an additional layer, not a replacement for Authentication or Security Rules.

Do not treat App Check as authorization.

## 15. Input validation

Validate incoming data at the appropriate trusted boundary.

Validate:
- email addresses
- phone numbers
- names
- date of birth
- gender values
- branch IDs
- usernames
- document IDs
- required fields
- maximum lengths
- allowed values

Reject malformed or unexpected input.

Frontend validation is for user experience, not security.

## 16. IDOR / cross-account protection

Pay special attention to direct-object access.

Example:
If Guardian A requests learner `123`, Security Rules or trusted backend logic must verify that Guardian A is linked to learner `123`.

Changing the learner ID to `124` must not reveal Guardian B's learner.

The same principle applies to:
- guardian IDs
- branch IDs
- Mompreneur IDs
- account IDs
- audit records

## 17. Account status

Support account states such as:
- `invited`
- `active`
- `suspended`
- `disabled`

Suspended/disabled accounts must lose access to protected application features.

Do not enforce account status only by hiding UI elements.

## 18. Guardian consent

Because learner records belong to minors, support a guardian-consent record.

Store:
- guardian ID
- learner ID
- consent status
- consent version
- consent timestamp

The system should be capable of recording that the guardian:
- confirmed they are authorized to act for the learner
- accepted the applicable privacy/consent wording

Do not treat receiving an invitation email as proof of consent.

The exact legal wording is handled separately.

## 19. Audit logging

Record important administrative/security events such as:
- Admin created Mompreneur
- Mompreneur created learner
- guardian linked to learner
- role changed
- account disabled
- branch assignment changed
- sensitive learner record changed

Audit logs must never store:
- passwords
- authentication tokens
- Firebase Admin credentials
- service-account private keys
- unnecessary personal information

Prefer server-side audit logging for sensitive actions.

## 20. Error handling

Production errors must not expose:
- Firebase Admin credentials
- service-account paths
- stack traces containing secrets
- authentication tokens
- internal implementation details that materially weaken security

Use clear, safe user-facing messages.

Detailed debugging output belongs only in development environments.

## 21. HTTPS

Production must use HTTPS.

Firebase Hosting already supports HTTPS, but any other host must also enforce HTTPS.

Do not design login or sensitive flows around plain HTTP.

## 22. Rate limiting and abuse protection

Protect sensitive operations such as:
- login attempts
- password reset
- invitation resend
- account activation
- privileged Cloud Functions

Use Firebase/Google protections, Cloud Functions safeguards, App Check, and additional rate controls where appropriate.

Do not claim App Check alone prevents abuse.

## 23. Google/Firebase administrator security

Accounts that administer the Firebase project should use strong account security, including 2-step verification.

Grant the minimum Google Cloud/Firebase project permissions necessary.

Do not give every collaborator Owner access.

## 24. Environment and project separation

Keep development and production separate.

Development:
- no real learner data
- test accounts only
- safe fictional information

Production:
- real data only after security review
- production Security Rules
- App Check enabled where appropriate
- backup/recovery plan
- restricted administrator access
- audit logging
- privacy review

Never copy real learner information into the development project for convenience.

## 25. Secrets and Git

Never commit:
- service-account JSON
- Admin private keys
- private server credentials
- secret environment files

Use environment-variable / secret-management mechanisms appropriate to the server runtime.

If a privileged credential is committed publicly, assume compromise and rotate/revoke it.

## 26. POPIA/privacy design

This platform processes personal information in South Africa and includes children's information.

Build using privacy-by-design principles:
- data minimization
- appropriate access control
- restricted child-data access
- auditability
- secure account management
- appropriate retention/deletion mechanisms
- documented consent where required

Do not claim that Firebase or code alone makes the system POPIA-compliant.

## 27. Security tests required

Before a feature is considered complete, test at minimum:

Anonymous user:
- cannot read learners
- cannot read guardians
- cannot read Mompreneurs
- cannot access protected branch data
- cannot use privileged admin operations

Guardian A:
- cannot read Guardian B's learners
- cannot modify Guardian B's learners
- cannot access Mompreneur functions
- cannot access Admin functions

Mompreneur A:
- cannot read protected records belonging only to another branch
- cannot change their branch authorization
- cannot change their role
- cannot create Admins
- cannot use privileged system functions

Normal user:
- cannot edit `users/{uid}.role`
- cannot edit `users/{uid}.status`
- cannot impersonate another UID through request data

Direct request testing:
- changing learner IDs must fail when unauthorized
- changing guardian IDs must fail when unauthorized
- changing branch IDs must fail when unauthorized
- calling protected functions without authentication must fail
- manipulating JSON request bodies must not bypass authorization

## 28. Security review before every backend feature

Before considering any backend feature complete, verify:

AUTHENTICATION
- Is the caller authenticated where required?

AUTHORIZATION
- Is the authenticated account allowed to perform the action?

ACCOUNT STATUS
- Is the account active?

OWNERSHIP / BRANCH
- Is the resource linked to the correct guardian, branch, or account?

SECURITY RULES
- Would Firestore Security Rules block unauthorized direct browser access?

SERVER TRUST
- Are privileged actions performed only by trusted server-side code?

INPUT VALIDATION
- Is incoming data validated?

SECRETS
- Are Admin credentials completely absent from frontend code?

DATA EXPOSURE
- Does the code return only information required by the current page?

LOGGING
- Could passwords, tokens, or sensitive child information appear in logs?

ABUSE
- Could the endpoint/function be spammed or brute-forced?

PRIVACY
- Is unnecessary personal data being collected or exposed?

## 29. Coding rules for the AI

When editing this KIA codebase:
- preserve the existing design unless asked to redesign it
- inspect existing files before replacing security/session logic
- do not run two competing authentication systems at the same time
- Firebase Authentication is the single source of truth for login sessions
- Firestore/trusted claims are the source of truth for roles/permissions
- remove or migrate old localStorage/sessionStorage demo-auth logic when it conflicts with Firebase
- do not silently reintroduce preview/demo authentication
- do not create custom passwords
- do not loosen Security Rules to make a feature work
- explain what files are being changed
- tell the developer exactly where new files belong
- keep implementation understandable for a developer who is still learning backend
- build and test one backend feature at a time

## 30. Current KIA implementation status — reset on 7 October 2026

The user explicitly requested removal of all previous backend integration.
This delivery contains no authentication provider, cloud configuration, database
rules, password handling, local login sessions or working invitation links.
The cloud project must be deleted by the user following RESET-GUIDE.md; code
cleanup does not delete cloud resources. Do not claim deletion has happened.

The frontend includes a localhost-only design preview. The user requested removal
of visible demo/sample labels on 9 October 2026; keep that presentation choice.
Its fictional page fixtures are not accounts or authorization. Do not connect
these fixtures to production data or reuse them as a login system.

The remaining numbered rules are requirements for the fresh backend rebuild,
not statements that any service is currently enabled. Rebuild one feature at
a time, using admin, mompreneur and guardian authentication with learners as
linked records. Never restore the old custom password system.

## 31. Final security rule

Never claim:
- "This system can never be hacked."
- "The information can never leak."

No system can guarantee that.

Use defense in depth:
Firebase Authentication
+ Firestore Security Rules
+ trusted server-side Admin SDK operations
+ strict authorization
+ input validation
+ App Check
+ least-privilege admin access
+ audit logging
+ backups/recovery
+ privacy controls
+ security testing

Security is part of the architecture from the beginning.
