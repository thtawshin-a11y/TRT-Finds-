# TRT Finds — Security Specification & Red Team Audit

## 1. Data Invariants
1. **Storefront Product Visibility**: Unauthenticated visitors and non-admin users can only read (`get`/`list`) products where `isPublished == true`. Draft products (`isPublished == false`) are exclusively visible to verified administrators.
2. **Admin Authorization**: Administrative writes to `/products`, `/categories`, and `/admins`, as well as reads on `/analytics`, are restricted to verified administrators (`ause0155@gmail.com` with `email_verified == true` or verified UIDs in `/admins/{uid}`).
3. **PII Isolation**: User email addresses are isolated in `/users/{userId}/private/info`, strictly readable/writable only by the owning verified user or an admin.
4. **Wishlist Integrity**: Wishlist items live in `/wishlists/{userId}/items/{productId}`, require `request.auth.uid == userId`, verified email, valid `userId == request.auth.uid` payload matching, and `exists(/databases/.../products/{productId})`.
5. **Immutable Telemetry**: Visitors can create bounded `/analytics/{eventId}` events with `createdAt == request.time`, but cannot read, list, or mutate analytics history.
6. **Temporal & Identity Integrity**: All `createdAt` and `updatedAt` timestamps must match `request.time`; `createdAt` and `createdBy` / `uid` are immutable on update.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unverified Admin Email Spoof**: Write to `/products/p1` with `email: "ause0155@gmail.com"` and `email_verified: false`.
2. **Self-Promoted Admin**: Regular user writes `/admins/<myUid>` trying to grant themselves admin privileges.
3. **Shadow Field Injection on Product**: Create `/products/p2` with valid fields plus `"ghostRole": "superuser"`.
4. **Draft Scraping by Public Visitor**: Unauthenticated `list` query on `/products` without `where("isPublished", "==", true)`.
5. **PII Cross-User Read**: Signed-in user A requests `get` on `/users/userB/private/info`.
6. **Wishlist Cross-User Spoof**: User A creates `/wishlists/userB/items/p1` or sets `userId: "userB"` inside `/wishlists/userA/items/p1`.
7. **Orphaned Wishlist Item**: User A creates `/wishlists/userA/items/nonexistent_product`.
8. **ID Poisoning**: Creating `/products/` with a 200-char ID or invalid characters (`../hack`).
9. **Client Timestamp Tampering**: Creating `/products/p3` with backdated `createdAt` instead of `request.time`.
10. **Immutable Field Overwrite**: Updating `/products/p3` and changing `createdBy` or `createdAt`.
11. **Analytics Snooping**: Non-admin authenticated user attempts `list` on `/analytics`.
12. **Resource Exhaustion**: Creating `/analytics/evt1` with a 10KB `path` string or invalid `type: "hack"`.
