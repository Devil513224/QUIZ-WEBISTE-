# Security Specification & Payload-First TDD (`security_spec.md`)

## 1. Data Invariants
1. **Admin RBAC Isolation**: Only authenticated users whose email is verified (`request.auth.token.email_verified == true`) AND either matches the bootstrapped owner email (`tanmaypc2006@gmail.com`) or has an explicit `/admins/{uid}` document can read draft content, manage students/reports/logs, or mutate any catalog/CMS collection (`questions`, `tests`, `materials`, `courses`, `affairs`, `jobs`, `banners`, `homepageSections`, `notifications`, `typingPassages`, `catalogRows`, `reports`, `activityLogs`).
2. **PII Separation**: Student emails are isolated inside `/usersPrivate/{userId}` and readable only by the document owner or an admin. `/usersPublic/{userId}` holds only non-PII display preferences and points, and is readable only by the owner or an admin.
3. **Draft Protection on List Queries**: Public `get` and `list` queries on catalog collections require `resource.data.published == true` (or `resource.data.visible == true` for banners and homepage sections) unless the caller is `isAdmin()`.
4. **Privilege Escalation Prevention**: Users creating `/usersPublic/{userId}` must match `request.auth.uid`, set `status == 'Active'`, and cannot alter `status`, `uid`, or `createdAt` on update.
5. **Strict Payload Boundaries & Timestamps**: All document IDs match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars), strings enforce `.size()` bounds, arrays enforce `.size()` bounds and first-element typing, `request.time` validates `createdAt` / `updatedAt`, and `affectedKeys().hasOnly(...)` guards all updates.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Question Injection**: Unauthenticated client attempts `create` on `/questions/q_hack` -> `PERMISSION_DENIED`.
2. **Non-Admin Student Quiz Creation**: Verified student attempts `create` on `/tests/t_fake` -> `PERMISSION_DENIED`.
3. **Non-Admin PDF Upload / Material Tampering**: Verified student attempts `update` on `/materials/m1` -> `PERMISSION_DENIED`.
4. **Unverified Admin Email Spoof**: User with `email: 'tanmaypc2006@gmail.com'` and `email_verified: false` attempts `write` on `/banners/b1` -> `PERMISSION_DENIED`.
5. **Blanket List of Draft Questions**: Unauthenticated client executes `list` on `/questions` without `where('published', '==', true)` when drafts exist -> `PERMISSION_DENIED`.
6. **Cross-User PII Read**: Student A attempts `get` on `/usersPrivate/studentB` -> `PERMISSION_DENIED`.
7. **Self-Assigned Admin Record**: Student A attempts `create` on `/admins/studentA` -> `PERMISSION_DENIED`.
8. **Shadow Field Injection on User Profile**: Student A sends `{ uid: 'studentA', displayName: 'Legit', ..., isAdmin: true }` to `/usersPublic/studentA` -> `PERMISSION_DENIED`.
9. **Status Self-Unsuspend**: Suspended Student A attempts `update` on `/usersPublic/studentA` changing `status` from `'Suspended'` to `'Active'` -> `PERMISSION_DENIED`.
10. **ID Poisoning Attack**: Admin or user attempts `setDoc` at `/usersPublic/` with a 500-char invalid ID containing `$` or `/` -> `PERMISSION_DENIED`.
11. **Timestamp Forgery**: User attempts `create` on `/usersPublic/studentA` with backdated `createdAt` instead of `request.time` -> `PERMISSION_DENIED`.
12. **Activity Log Tampering by Student**: Student attempts `create` or `list` on `/activityLogs` -> `PERMISSION_DENIED`.
