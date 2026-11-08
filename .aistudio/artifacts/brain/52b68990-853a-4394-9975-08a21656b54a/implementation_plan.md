# Friend Requests Hub & Strict Recipient Validation

Provides a dedicated Friend Requests manager modal on the Friends & Chat tab (with Incoming and Sent tabs, request counters, and one-click Accept/Decline actions) and enforces strict account verification to prevent successful notifications for non-existent handles.

## User Review & Critical Decisions

> [!IMPORTANT]
> Both user preferences have been confirmed and incorporated into this specification:
> - **Friend Requests View**: A dedicated popup modal accessible via a new button positioned above the Add Friend input on the Friends & Chat tab, featuring tabbed sections for **Incoming Requests** (with Accept & Decline actions) and **Sent Requests** (with pending badges and Cancel option).
> - **Error Feedback**: A prominent red alert banner dynamically displayed when attempting to send a request to a non-existent account, explicitly stating that the user does not exist without creating or reporting a false-positive request.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Friend Requests Hub Button & Modal**: Adds an intuitive request management trigger directly above the Add Friend bar (`Friend Requests (N)` with an active indicator badge). Clicking it opens an editorial modal where users can inspect all pending requests they have received (with Accept / Decline buttons) and requests they have sent out (with pending status and withdrawal option).
  2. **Strict Recipient Validation**: Checks candidate usernames against registered accounts on both the server database and local state. If the target handle is not found, it strictly rejects the operation, prevents fake local request creation, and displays a red error alert: `User @handle does not exist.`
- **Target Audience / Persona**: Photographers and studio clients collaborating, sharing high-res proof packages, and establishing verified peer connections.
- **Key Value**: Eliminates confusion over where received friend requests land, empowers creators to accept or reject connections, and prevents phantom friend requests to invalid usernames.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Receiving & Managing Requests**:
   - The user opens the **Friends & Direct File Transfer** tab.
   - Above the Add Friend form, a button reads `Manage Requests (N)` (highlighted with an accent badge if incoming requests exist).
   - Clicking opens the **Friend Requests Hub Modal**:
     - **Incoming Tab**: Lists requests sent by other creators with avatar, username, timestamp, and instant `Accept` and `Decline` action buttons. Accepting instantly adds the user to mutual friends and opens live peer messaging.
     - **Sent Tab**: Lists outstanding outgoing requests with timestamp and a `Cancel Request` button.
2. **Sending a Request to a Valid Account**:
   - The user types a registered handle (e.g. `daddy` or `@daddy`) and clicks `Add Friend`.
   - The system verifies the user exists on the server.
   - Displays a green success confirmation: `Friend request sent to @daddy!` and updates the `Sent Requests` counter.
3. **Attempting to Add a Non-Existent Account**:
   - The user types an invalid or unregistered handle (e.g. `nonexistent_user`).
   - The system checks local and server records. Upon 404 / null match, it aborts immediately.
   - A red error banner appears: `User @nonexistent_user does not exist.` No false success toast, no phantom entries.

### Visual Identity & Theme
- **Theme**: Monochromatic minimalist editorial styling consistent with Noir Archive.
- **Dark Mode**: Pitch black (`#0a0a0f`) card surface, hairline borders (`border-neutral-800`), crisp white typography, and vibrant cobalt blue accent (`#2563eb`) for primary actions.
- **Light Mode**: Crisp off-white (`#fbfbfd`), slate borders (`border-slate-200`), dark slate typography (`text-slate-900`), and royal blue accents.
- **Typography**: Clean Neo-Grotesque display headings (`font-sans tracking-tight font-semibold`) paired with Space Mono metadata tags (`font-mono text-xs`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dedicated Modal vs. In-Page Accordion**
  - *Chosen Approach*: Dedicated popup modal (`FriendRequestsModal`).
  - *Why*: Accommodates both incoming and outgoing requests without pushing the chat window and friend list down the page, keeping the messenger view clean and focused.
  - *Alternatives Considered*: Expandable drawer above the input was considered, but risks pushing conversation threads off-screen on smaller laptop displays.

- **Decision 2: Two-Tier Account Verification (Server API + Seed Verification)**
  - *Chosen Approach*: Asynchronous validation against `/api/users/:username` or server user registry before confirming friend request creation.
  - *Why*: Solves the false-positive bug where the client was previously recording a request even when the user didn't exist in the database.
  - *Alternatives Considered*: Pure client-side check was prone to misses if a user registered in another session without yet polling; verifying with the server API guarantees accuracy.

---

## 4. Technical Architecture & Data Strategy

### System Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      FriendsMessenger.tsx                    │
│                                                              │
│  [ Manage Requests (N) Button ]  ──> opens FriendRequestsModal │
│  [ @ [username input] ] [ Add Friend Button ]                │
│  { RequestFeedback: Red Alert Banner on non-existent handle }│
└──────────────┬──────────────────────────────┬────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│    FriendRequestsModal.tsx   │ │        AppContext.tsx       │
│  - Tab: Incoming Requests    │ │ - users (synced)            │
│    [Accept]  [Decline]       │ │ - friendRequests (synced)   │
│  - Tab: Sent Requests        │ │ - sendFriendRequestAction() │
│    [Cancel Request]          │ │ - acceptFriendRequestAction │
└──────────────┬───────────────┘ └─────────────┬───────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────────────────────────────────────┐
│                          server.ts                           │
│  - GET  /api/users/:username (checks user existence)        │
│  - GET  /api/friend-requests?user=:username                  │
│  - POST /api/friend-requests (validates existence & creates) │
│  - POST /api/friend-requests/:id/accept                      │
│  - POST /api/friend-requests/:id/decline                     │
│  - DELETE /api/friend-requests/:id (cancel sent request)     │
└──────────────────────────────────────────────────────────────┘
```

### Data Model & Action Flow
1. **Validation Pipeline**:
   - `sendFriendRequestAction(toUsername)` validates username format.
   - Verifies target user exists in `users` state or queries `GET /api/users/:username`.
   - If user does not exist: returns `{ success: false, error: 'User @' + cleanTo + ' does not exist.' }`.
   - If user exists: posts to `/api/friend-requests`, stores in state, and returns `{ success: true }`.
2. **Friend Request Management Actions**:
   - `acceptFriendRequestAction(requestId)`: updates state and server, mutually adds both users to friends list.
   - `declineFriendRequestAction(requestId)`: marks request as declined.
   - `cancelFriendRequestAction(requestId)`: deletes or revokes an outgoing pending request.
