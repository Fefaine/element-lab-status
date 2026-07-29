# element-lab-status

Experimental UI for Element's user status feature, extending the official MSC4426 implementation ([element-web PR #32991](https://github.com/element-hq/element-web/pull/32991)) with a visual emoji picker, duration controls, and accessible flyout UX.

This is a standalone React prototype that hooks into Element's MSC4426 architecture via an `IMatrixClient` interface. Swap the included `MockMatrixClient` (localStorage-backed) for the real `MatrixClient` from `matrix-js-sdk` to run inside Element.

## Attribution

The MSC4426 protocol integration code (`statusUtils.ts`, `useUserStatus.ts`) is a re-implementation of patterns from [element-hq/element-web](https://github.com/element-hq/element-web) (PR [#32991](https://github.com/element-hq/element-web/pull/32991) by @Half-Shot and @dbkr). The validation logic, API call patterns, and data shapes are derived from their AGPL-3.0 / GPL-3.0 licensed work. Specifically:

- `validateUserStatus`, `validateMCallStatus`, `userStatusFromProfile` — mirror `utils/userStatus.ts`
- `fetchUserStatus`, `setUserStatusOnServer`, `clearUserStatusOnServer`, `setUserOnCall` — mirror server interaction patterns
- `userStatusTextWithinMaxLength`, `extractFirstGrapheme` — mirror their validation approach
- `useUserStatus` hook structure — mirrors `hooks/useUserStatus.ts`

The UI components (StatusPicker, EmojiGrid, DurationPicker, StatusDisplay), i18n system, duration/expiry feature, accessibility implementation, and CSS are original work.

If contributing upstream, this code would fall under Element's [CLA](https://cla-assistant.io/element-hq/element-web) and the repository's AGPL-3.0 license.

## Protocol: MSC4426 Extended Profiles

Status is stored on the Matrix homeserver as extended profile properties:

- **`org.matrix.msc4426.status`** — `{ emoji: "🔴", text: "Busy working" }`
- **`org.matrix.msc4426.call`** — `{ call_joined_ts: 1719500000000 }` (auto-set when joining calls)

Constraints (matching Element's implementation):
- Emoji must be exactly **one grapheme** (validated via `Intl.Segmenter`)
- Text is limited to **256 bytes UTF-8** (not characters)
- Custom status takes precedence over call status

### Our enhancement: client-side duration

MSC4426 doesn't define expiry/duration. We add this as a client-side feature:
- Duration metadata (always / until / range) is stored in localStorage
- The hook auto-clears status on the server when the local timer expires
- Other users see the status but not the duration — it's a personal UX feature

## Integration with Element

To drop this into element-web:

1. Replace `MockMatrixClient` → `useMatrixClientContext()` from Element
2. Replace our `I18nProvider` → Element's `_t()` / `_td()` system
3. Place `StatusPicker` in the user menu or profile panel
4. Wire `StatusDisplay` into `DisambiguatedProfile`, `MemberTile`, `UserInfo`
5. Optionally persist duration to account data (`m.status_duration`) for cross-device sync

---

# User Stories

Based on [element-meta#2457](https://github.com/element-hq/element-meta/issues/2457)

## US-1: Set a status via profile picture flyout
```
As a user,
I can click my profile avatar to open a flyout menu where I set my status,
so that I don't need to change my display name to communicate availability.
```

## US-2: Select a status emoji from presets
```
As a user,
I can pick from a grid of predefined emoji icons (Available, Busy, DND, BRB, Out of Office, In a Meeting, etc.),
so that I can quickly indicate my state without searching for emojis.
```

## US-3: Write a custom status message
```
As a user,
I can type a free-text message (up to 256 bytes UTF-8) alongside my chosen emoji,
so that I can provide context beyond just the icon (e.g., "Back at 3pm" or "On parental leave until March").
```

## US-4: Choose status duration
```
As a user,
I can set how long my status is displayed — always, until a specific time, or during a custom time range —
so that my status auto-clears without me remembering to do it manually.
```

## US-5: See my own current status
```
As a user,
I can see my active status displayed next to my profile picture and in my profile area,
so that I have confirmation of what others see.
```

## US-6: View other users' status in the member list
```
As a user,
I can see a status emoji badge next to each room member who has set a status,
so that I know their availability at a glance without asking.
```

## US-7: Hover to see full status details
```
As a user,
I can hover over (or focus on) a status emoji to see a tooltip showing the full message and duration,
so that I get detailed context without navigating away.
```

## US-8: Clear my status
```
As a user,
I can clear my current status from the flyout menu,
so that I can remove it before it auto-expires if my situation changes.
```

## US-9: Status syncs via MSC4426
```
As a user,
my status is stored on the Matrix homeserver via extended profiles,
so that it's visible to other users across all my rooms and survives page refreshes.
```

## US-10: Status auto-expires
```
As a user,
my status automatically disappears when its duration ends (client-side timer clears it on the server),
so that stale "In a meeting" statuses don't persist after the meeting is over.
```

## US-11: Automatic call status
```
As a user,
when I join an Element Call, my status automatically shows "📞 On a call",
so that others know I'm unavailable without me setting it manually.
```

## US-12: Use the feature in my own language
```
As a user,
I can see the status UI in my preferred language (English, German, French, Spanish, or Japanese),
so that the feature is accessible to our international team.
```

## US-13: Navigate the status picker with keyboard only
```
As a user who relies on keyboard navigation,
I can use arrow keys to browse emojis, Enter/Space to select, Escape to close, and Tab to move between fields,
so that the feature is fully accessible without a mouse.
```

## US-14: Understand status information via screen reader
```
As a user with a screen reader,
I hear meaningful labels for emojis, status states, and tooltips via ARIA attributes,
so that I have equal access to status information.
```

---

# Design Elements

The emojis used (✅, 🔴, ⛔, 🕐, 🏖️, 📅, 🍽️, 🏠, 🚗, 🤒, 📵, 💻) are Unicode characters defined in the open Unicode Standard. Rendering varies by platform (Segoe UI Emoji on Windows, Apple Color Emoji on macOS, Noto on Android/Linux).

For cross-platform visual consistency, you could bundle:
- **Twemoji** (Twitter/X) — CC-BY 4.0
- **Noto Color Emoji** (Google) — Apache 2.0
- **OpenMoji** — CC-BY-SA 4.0

Element Desktop (Electron/Chromium) uses native Unicode rendering, which is the standard approach.

---

# Tests

Tests need to be updated to match the MSC4426 refactor. The test architecture covers:

## statusUtils.test.ts
- `validateUserStatus` — accepts valid `{ emoji, text }`, rejects missing fields, enforces single grapheme, truncates oversized text
- `validateMCallStatus` — accepts valid call status, rejects malformed data
- `userStatusFromProfile` — custom status takes precedence over call status
- `userStatusTextWithinMaxLength` — UTF-8 byte length validation
- `extractFirstGrapheme` — Intl.Segmenter grapheme extraction
- `isStatusActive` — duration expiry logic (always/until/range)
- `sanitizeText` — strips control chars, bidi overrides
- `formatDuration` — i18n-aware duration formatting

## useUserStatus.test.ts
- Fetches initial status from server on mount
- Sets status via `setExtendedProfileProperty`
- Clears status on server and locally
- Auto-clears when duration expires
- Reacts to real-time profile update events
- Handles server errors gracefully
- Validates single-grapheme emoji before saving
- Enforces 256-byte UTF-8 text limit

## StatusPicker.test.tsx
- Renders dialog with correct i18n title
- Emoji selection updates preview
- Text input with character count
- Duration picker integration
- Save/Clear/Close callbacks
- Keyboard navigation (Escape, Enter)
- Locale switching

## EmojiGrid.test.tsx
- ARIA grid structure
- Keyboard navigation (arrows, Enter, Space)
- Roving tabindex
- Selection state

## DurationPicker.test.tsx
- Type switching (always/until/range)
- Conditional time inputs
- i18n labels

## StatusDisplay.test.tsx
- Renders both `UserStatus` and `UserStatusWithDuration`
- Tooltip with/without duration info
- Accessibility labels
- Size variants

## i18n.test.tsx
- All 5 locales
- Interpolation
- Dynamic switching
- Fallback behavior
