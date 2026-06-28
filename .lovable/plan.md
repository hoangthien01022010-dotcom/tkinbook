
## Scope

The uploaded `kinbook-base-main` is a **Vite + React Router + JSX** app (~80 files, ~30 referencing `base44.*`). The current Lovable project is a fresh **TanStack Start TSX** template. To keep the Kinbook UI 100% intact, the simplest and lowest-risk path is to **replace the template with the uploaded Vite + React app**, then rewire backend.

## Steps

### 1. Reshape project to Vite + React Router (match upload)
- Delete TanStack Start scaffolding (`src/routes`, `src/router.tsx`, `src/start.ts`, `src/server.ts`, `vite.config.ts`).
- New `vite.config.js` with `@vitejs/plugin-react` + `@` alias to `src`.
- Rewrite `package.json` deps to match upload (React 18 + react-router-dom 6 + radix-ui + @tanstack/react-query + framer-motion + supabase-js + etc).
- Copy upload files into `src/` with the directory structure the imports expect:
  - `src/pages/` ← `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `Home.jsx`, `AdminPanel.jsx`, `Welcome.jsx`, `CallRoom.jsx`, `CodeExplorer.jsx`, `AIAgent.jsx`, `Backup.jsx`
  - `src/components/` ← `ChatWindow`, `ConversationList`, `MessageBubble`, `NewChatModal`, `NewGroupModal`, `FriendsPanel`, `NotificationsPanel`, `ProfilePanel`, `AIBotChat`, `AISettingsTab`, `AICodeAnalyzer`, `ConversationInfo`, `ConversationSettingsMenu`, `Avatar`, `AuthLayout`, `GoogleIcon`, `ProtectedRoute`, `ScrollToTop`, `UserNotRegisteredError`, `PageNotFound`
  - `src/components/ui/` ← all shadcn primitives from upload (`button.jsx`, `dialog.jsx`, …)
  - `src/lib/` ← `supabaseClient.js`, `AuthContext.jsx`, `ThemeContext.jsx`, `utils.js`, `useCurrentUser.js`, `aiQueue.js`, `query-client.js`, `app-params.js`
  - `src/api/entities.js` ← keep, points to supabase
- `index.html` + `main.jsx` from upload.

### 2. Enable Lovable Cloud + schema
- Call `supabase--enable`.
- Migration:
  - `profiles` (id uuid PK = auth.users.id, email, full_name, avatar_url, is_admin bool default false, created_at, updated_at) + trigger to auto-create on signup.
  - `conversations` (id, name, is_group, created_by, created_at, updated_at).
  - `conversation_members` (conversation_id, user_id, joined_at) — join table.
  - `messages` (id, conversation_id, sender_id, content, type, created_at).
  - `friendships` (id, requester_id, addressee_id, status).
  - `notifications` (id, user_id, type, payload jsonb, read bool).
  - `call_rooms` (id, conversation_id, created_by, started_at, ended_at).
  - All with RLS using `auth.uid()`; user-owned data scoped; explicit `GRANT`s per the public-schema-grants rule.
- Seed: insert/upsert `profiles` row for `hoangthien10ku@gmail.com` with `is_admin=true` (resolved via `auth.users` lookup in migration).

### 3. Auth migration (`AuthContext.jsx`, `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`)
- Drop all `base44.auth.*`.
- `AuthContext` listens to `supabase.auth.onAuthStateChange`, exposes `user`, `profile`, `isAdmin`, `isLoadingAuth`, `signOut`.
- Login: `supabase.auth.signInWithPassword`.
- Register: `supabase.auth.signUp` with `emailRedirectTo: window.location.origin` + profile creation via DB trigger.
- ForgotPassword: `resetPasswordForEmail` redirecting to `/reset-password`.
- ResetPassword: `supabase.auth.updateUser({ password })`.
- Logout: `supabase.auth.signOut`.
- Google OAuth button preserved but wired to `supabase.auth.signInWithOAuth({ provider: 'google' })`.

### 4. Replace AI bots (`AIBotChat.jsx`, `AIAgent.jsx`, `AICodeAnalyzer.jsx`)
- Add edge function `supabase/functions/ai-chat/index.ts` that streams from Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1`, model `google/gemini-2.5-flash`, header `Authorization: Bearer ${LOVABLE_API_KEY}`).
- `AIBotChat` and `AIAgent` send conversation history → edge function, persist user + assistant messages to `messages` table tagged with `sender_id = NULL, is_ai = true` and a dedicated AI conversation per user.
- Remove `base44.integrations.*` imports.

### 5. CallRoom + Admin
- `CallRoom.jsx`: keep UI; replace base44 calls with supabase reads/writes against `call_rooms` + realtime channel per room (Supabase realtime).
- `AdminPanel.jsx`: list `profiles`, toggle `is_admin`, guarded by `useAuth().isAdmin`.

### 6. Clean sweep
- Delete `base44Client.js`.
- `rg -l "base44"` → rewrite every hit. Each onClick/event handler routes through `supabase` directly (no dead buttons).
- Replace `User.me()` with `supabase.auth.getUser()` + `profiles` join everywhere.

### 7. Verify
- Run build; fix any unresolved imports.
- Smoke-test via Playwright in sandbox: load `/login`, register, send AI message.

## Notes / decisions baked in
- React Router (not TanStack Router) — matches upload, fastest path to preserving UI.
- Lovable Cloud (Supabase) used everywhere; no other backends.
- `is_admin` lives on `profiles` for simplicity (the user explicitly named the column "Hồ sơ người dùng"). A proper `user_roles` table is best-practice but the user's spec asked for admin on the profile table; I'll follow the spec.
- AI conversations stored in the same `conversations`/`messages` tables, flagged with `is_ai_bot=true` on the conversation row.

## Risks
- ~30 files to rewrite; some base44 calls (e.g. `base44.functions.invoke`) may have non-obvious intent. I'll keep semantics minimal and wire to supabase or remove dead code where unused.
- Realtime call signaling for `CallRoom` will be a thin Supabase Realtime channel; not a full WebRTC stack unless one already exists in the source (will check on implementation).

Confirm and I'll execute end-to-end.
