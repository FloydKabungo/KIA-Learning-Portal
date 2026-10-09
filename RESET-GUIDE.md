# Start fresh — VS Code and Firebase

This guide applies to the old KIA development project. The updated code is clean;
the online Firebase project has NOT been deleted by this ZIP.

## 1. Open the clean files in VS Code

1. Stop Live Server and close tabs showing the old portal.
2. Extract this ZIP into a new folder, for example `KIA-Clean-Frontend`.
3. In VS Code, choose **File → Open Folder**, then the extracted `KIA` folder.
4. Open `login.html` with Live Server. Login is intentionally disabled.
5. Use the local Admin / Mompreneur / Learner preview links to see the designs.
   No passwords or test accounts are required. Use fictional information only.

Keep the old ZIP separately as a backup, not inside the new website folder.
Do not mix the old and new copies. The account model for the rebuild is in
AGENTS.md: admin, mompreneur and guardian accounts, with learners as records.

## 2. Update your existing Git project

Opening the new folder does not update your existing Git repository. When you
are ready to copy this clean version into that repository:

1. Save or commit any other work first. Keep the existing `.git` folder.
2. Copy the clean KIA contents into the matching website folder in your repository.
3. Delete these old files from that website folder if still present (copying new
   files over the folder does not remove them):
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
4. If your computer has additional backend work that was not in the supplied ZIP,
   review that too: old Firebase project mappings/config, emulator output,
   deployment workflows, Functions code and service-account files must not be
   brought into the new clean website. Check `.firebaserc`, `firebase.json`,
   `firestore.indexes.json`, `storage.rules`, `.firebase/`, and any `functions/`
   folder. Only remove files belonging to this old integration. These were not
   present in the ZIP I inspected.
5. Open VS Code **Source Control**. Confirm the removed files appear as deletions
   and the frontend changes as modifications. Commit this clean reset and push
   when ready. Do not replace or delete the repository's `.git` folder.

This changes current files, not previous Git commits. If you previously committed
an Admin private key, deleting the file is insufficient: revoke that key. The
provided ZIP contained a normal web configuration, not an Admin private key.
You do not need to uninstall VS Code, Node.js or the Firebase CLI to restart a
project.

## 3. Clear the old portal data in your browser

Do this on your old portal URL, not on the Firebase Console:

1. Open the old portal in Chrome and press **F12**.
2. Open **Application → Storage → Clear site data**.
3. Close other old portal tabs and reopen the clean project in Live Server.

Repeat for the old hosted portal URL if you used it, and for each localhost
address/port you used. This clears that site's cookies, browser storage and
cached data, including old login state. Other apps on the exact same origin
may also lose their local data, so check the URL first. This does not delete
anything from Firebase itself.

## 4. Delete the old Firebase development project

**This removes the selected project and its Firebase/Google Cloud services.**
Export anything you actually need first. Confirm it is only your old KIA test
project and contains no unrelated website, business service or live learner data.

The old configuration in your ZIP points to:

- Project ID: `kia-portal-development`
- Previously recorded name: `KIA Portal Development`

1. Open https://console.firebase.google.com/ and sign in with the Google account
   that owns this project.
2. Select the old KIA development project. Check its **Project ID**, not just
   its display name, against the value above.
3. Beside **Project Overview**, click the **gear icon → Project settings**.
4. Open **General**, scroll down and click **Delete project**.
5. Read the effects, tick the acknowledgement boxes and confirm **Delete project**.
   Enter the project ID if the console asks for it.

Do not use **Remove app** for a full reset: that removes an app registration,
not the whole project's database and services. You do not need to delete every
Auth user and collection individually when deleting this entire test project.

Google provides a 30-day project recovery window. Some resources may disappear
sooner; do not rely on restoration as a backup. The old project ID cannot be
reused for a new project. Use a new ID when we rebuild. Outstanding charges may
still appear if billing was enabled. Keep your Google account and other projects.

If deletion is unavailable or an error mentions permissions or a lien, do not
remove unrelated safeguards. Take a screenshot of the error (without credentials)
and we can resolve that exact issue.

Official instructions, checked 7 October 2026:
- https://support.google.com/firebase/answer/9137886?hl=en
- https://docs.cloud.google.com/resource-manager/docs/delete-restore-projects
- https://support.google.com/firebase/answer/7047853?hl=en

## 5. Where the fresh rebuild begins

After the reset, start a new development project with a new project ID. Build
and test the admin login first, then Mompreneur and guardian access, then learner
linking. Connect the remaining features in BACKEND-NEXT-STEPS.md one at a time.
Use the standing AGENTS.md rules throughout. No new backend was created in this
reset delivery.
