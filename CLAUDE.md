@AGENTS.md

## Platform

Android only (Google Play) for now. iOS isn't planned, so skip iOS-only work.

## Launch checklist (Google Play)

Work through these one at a time. Tick an item when it's done.

### Blockers for Play

- [ ] **1. Privacy policy.** Replace the `example.com` placeholder in `src/constants/links.ts` with a real page, and fill in Play's Data safety form to match. It should say:
  - Passwords are stored on the device.
  - Backups go to the user's own Google Drive, encrypted.
  - The Google email is used for backup.
  - Breach checks send a partial hash to HIBP.
- [ ] **2. Google sign-in in store builds.**
  - Publish the OAuth consent screen. In "Testing" mode only listed test users can sign in, and only for 7 days.
  - Add the Play App Signing SHA-1 (Play Console → App integrity) to the Android OAuth client. Without it, sign-in fails with `DEVELOPER_ERROR` on Play installs.
- [ ] **3. Delete backup for users.** Turn the dev-only "Delete Drive backup" button in `src/app/setting/back-and-restore.tsx` into a real option with a confirmation dialog.
- [ ] **4. Release build setup.** There's no `eas.json` yet. Add an AAB build profile (EAS, or local `gradlew bundleRelease`) and an upload keystore that's kept safe.
- [ ] **5. Closed testing.** A new personal Play developer account needs a closed test with 12 or more testers for 14 days before it can get production access. Plan for that time.

### Should fix before public launch

- [ ] **6. Encrypt notes** in the local DB, and ideally usernames and URLs too. Today only `encrypted_password` is encrypted.
- [x] **7. Clear the clipboard** automatically 30–60 seconds after a password is copied (`handleCopyPassword` in `src/app/password/detail/[id].tsx`).
  - Done through the local `modules/secure-clipboard` module: the copy is flagged as sensitive, and a WorkManager job clears it after 45s.
  - Known limit: keyboards with clipboard history, like Gboard, may keep their own copy. It shows as dots, but tapping it still pastes the password. The app can't delete another app's data. Gboard removes the item after about an hour, or the user can delete it themselves.
- [ ] **8. Block screenshots and the recent-apps preview** with `expo-screen-capture`, which sets Android's `FLAG_SECURE`.

### Soon after

- [ ] **9. PBKDF2 rounds.** Raise from 100k to 600k in `src/lib/crypto.ts`, with a migration for existing vaults and older backups.
- [ ] **10. Crash reporting and tests.** Add crash reporting, and add tests for the backup file format and the restore merge to the repo.
