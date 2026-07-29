# element-lab-status
Experimental tests and proofs of concept for potential element status features. This repository is a playground for exploring ideas, validating assumptions, and seeing what works (or doesn't). No roadmap, no guarantees — just curiosity-driven experimentation.

# LocalStorage

```
// In a real integration, this would call:
// matrixClient.setPresence({ presence: "online", status_msg: serializeStatus(newStatus) });
```

For the feature to actually work in Element, localStorage needs to get replaced with the Matrix protocol's m.presence event. That event broadcasts your status_msg field to everyone in your rooms via the homeserver. The serializeStatus/deserializeStatus utilities are already built for this — they encode the emoji, text, and duration into a JSON string that fits in status_msg.


# User stories implemented
Stories are based on this request https://github.com/element-hq/element-meta/issues/2457

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
I can type a free-text message (up to 280 characters) alongside my chosen emoji, 
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
As a user, I can hover over (or focus on) a status emoji to see a tooltip showing the full message and duration, 
so that I get detailed context without navigating away.
```
## US-8: Clear my status 
```
As a user, I can clear my current status from the flyout menu, 
so that I can remove it before it auto-expires if my situation changes.
```
## US-9: Status persists across sessions 
```
As a user, 
my status survives page refreshes and app restarts (while still active), 
so that I don't lose it after reloading Element.
```
## US-10: Status auto-expires 
```
As a user, my status automatically disappears when its duration ends, 
so that stale "In a meeting" statuses don't persist after the meeting is over.
```
## US-11: Use the feature in my own language 
```
As a user, 
I can see the status UI in my preferred language (English, German, French, Spanish, or Japanese), 
so that the feature is accessible to our international team.
```
## US-12: Navigate the status picker with keyboard only 
```
As a user who relies on keyboard navigation, 
I can use arrow keys to browse emojis, Enter/Space to select, Escape to close, and Tab to move between fields, 
so that the feature is fully accessible without a mouse.
```
## US-13: Understand status information via screen reader 
```
As a user with a screen reader, 
I hear meaningful labels for emojis, status states, and tooltips via ARIA attributes, 
so that I have equal access to status information.
```
# Design elements
The emojis used (✅, 🔴, ⛔, 🕐, 🏖️, 📅, 🍽️, 🏠, 🚗, 🤒, 📵, 💻) are Unicode characters. They're defined in the Unicode Standard and are free to use by anyone.

However, the rendering of those characters varies by platform:
- Windows renders them using Segoe UI Emoji (Microsoft's design)
- macOS/iOS renders them using Apple Color Emoji (Apple's design)
- Android renders them using Noto Color Emoji (Google's design)
- Linux typically uses Noto or Twitter's Twemoji

The Unicode codepoints themselves are open standard.  This is the same thing every messaging app does (Slack, Teams, Discord, WhatsApp all embed Unicode emoji characters in text).

If you wanted cross-platform visual consistency (same look everywhere), you could bundle an open-source emoji set like:
- Twemoji (Twitter/X) — CC-BY 4.0 license
- Noto Color Emoji (Google) — Apache 2.0 license
- OpenMoji — CC-BY-SA 4.0 license

But for a feature targeting Element Desktop (which runs on Electron/Chromium), native Unicode emoji rendering is the standard approach and what other chat apps do.

# Jest Tests : 86 tests

The repo provides 86 test cases covering utility logic, React hooks, component rendering, keyboard accessibility, i18n, and security validation.

## statusUtils.test.ts (22 tests)

- isStatusActive — validates "always" returns true, future "until" returns true, past "until" returns false, "range" within/before/after boundaries
- isValidUserStatus — accepts valid statuses (always/until/range), rejects null, undefined, missing emoji, empty emoji, emoji too long, text too long, invalid dates, unknown duration types
- serializeStatus/deserializeStatus — round-trips all three duration types, handles special characters (pipes, quotes, HTML), strips bidi/control characters, rejects empty strings, malformed JSON, oversized payloads, missing -fields, invalid dates, range with end before start
- formatDuration — formats "always", formats "until" with today's date, accepts a custom translation function

## useUserStatus.test.ts (9 tests)

- Returns null on empty localStorage
- Sets status and persists to localStorage
- Clears status and removes from localStorage
- Trims text and enforces 280 char max on save
- Restores active status from localStorage on mount
- Discards expired status on mount
- Rejects malformed JSON in localStorage
- Rejects invalid shape in localStorage
- Rejects oversized localStorage data

## StatusPicker.test.tsx (12 tests)

- Renders dialog with correct title
- Shows placeholder when no emoji selected
- Selects emoji and updates preview
- Fills text input with default text on emoji select
- Allows typing custom status text
- Shows character count (280)
- Calls onSave with correct emoji/text/duration
- Disables Save when no emoji selected
- Shows/hides Clear button based on current status
- Calls onClear + onClose on clear
- Calls onClose on Escape key
- Renders in German locale

## EmojiGrid.test.tsx (12 tests)

- Renders all 12 preset buttons
- Has correct ARIA grid/row/gridcell structure
- Marks selected emoji with aria-pressed=true
- Marks others with aria-pressed=false
- Calls onSelect on click
- Arrow key navigation (right, left, down)
- Enter and Space select the focused emoji
- Boundary clamping (can't go before first or past last)
- Roving tabindex (only one tab stop at a time)

## DurationPicker.test.tsx (9 tests)

- Renders with "always" selected
- Shows legend text
- Hides time inputs for "always"
- Shows end time input for "until"
- Shows start + end inputs for "range"
- Calls onChange with correct type when switching between modes
- Renders in French locale

## StatusDisplay.test.tsx (11 tests)

- Renders emoji
- Correct aria-label with status text
- Falls back to emoji in aria-label when text empty
- No tooltip by default
- Shows tooltip on mouseEnter and focus
- Tooltip shows duration info
- Tooltip shows "No message" when text empty
- Hides tooltip when showTooltip=false
- Applies size CSS class
- Renders in Spanish locale
- Emoji is focusable (tabIndex=0)

## i18n.test.tsx (11 tests)

- English, German, French, Spanish, Japanese translations all work
- {{param}} interpolation works in all locales
- Falls back to key string when translation missing
- Dynamic locale switching (EN→DE, DE→FR)
- Throws when useTranslation used outside provider
- Validates all 12 emoji keys are translated in all 5 locales (60 assertions)
