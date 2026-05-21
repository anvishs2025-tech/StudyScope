# StudyScope

> Discover how you learn best.

StudyScope is a cross-platform mobile app (iOS, Android, Web) that helps students identify their unique learning style, screen for common learning patterns (focus, memory, processing speed, reading, math), and get a personalized study plan backed by an AI tutor.

Built with **React Native + Expo + TypeScript** on the frontend and a lightweight **Hono + tRPC** backend.

---

## Table of Contents

- [Demo](#demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Architecture](#architecture)
- [Subscription Plans](#subscription-plans)
- [Privacy & Disclaimer](#privacy--disclaimer)
- [License](#license)

---

## Demo

| Onboarding | Assessment | AI Chat | Results |
| :--------: | :--------: | :-----: | :-----: |
| _add screenshot_ | _add screenshot_ | _add screenshot_ | _add screenshot_ |

> Run on iOS Simulator, Android Emulator, or any browser via Expo.

---

## Features

### Core experience
- **Authentication** — username + email or phone, with 6-digit verification code.
- **Onboarding** — animated four-slide intro that explains the product.
- **Subscription gate** — choose between Free Trial (1 day), Monthly ($24.99/mo) or Annual ($274.99/yr) before entering the app.
- **Daily streaks** — animated streak bar on the home screen and detailed streak card in settings, persisted across sessions.

### Learning assessment
- **Upload your work** — students attach photos of tests/homework.
- **Learning style survey** — 10 weighted questions across visual / auditory / kinesthetic.
- **Screening questionnaire** — 15 weighted items covering ADHD (inattentive/hyperactive), dyslexia, dyscalculia, dysgraphia, working memory, processing speed, auditory & visual processing, and executive function. Includes an explicit "this is not a diagnosis" disclaimer.
- **9 brain games** — Pattern Logic, Memory Match, Quick Tap, Number Sequence, Stroop, Word Recognition, Sound Sequence, Visual Tracker, Math Flash. Each one captures accuracy, response time, response-time variability, and error patterns.
- **Personalized profile** — combines all signals into strength zones, friction zones, learning-style breakdown, condition indicators with severity, cognitive strengths, and concrete recommendations for student / teacher / parent.

### Premium-only
- **Patterns tab** — focus duration, best learning time, retention rate, learning style, problem-solving style, progress rate.
- **History tab** — full conversation history with the AI tutor and timeline of past assessment results.
- **Subscription management** — view current plan, days remaining, and switch plans directly from the profile screen.

### AI & ambience
- **StudyScope AI** — Rork-toolkit-powered chat assistant with vision (image attachments) and a `getStudyTip` tool. The assistant receives the student's full learning profile as context so every reply is personalized.
- **Study music** — built-in player with Focus / Relaxation / Energize / Ambient categories, animated equalizer, favourites, and a (mocked) Spotify connect flow.
- **Light & dark themes** with semantic color tokens.

---

## Tech Stack

**Frontend**
- React Native `0.81` + React `19`
- Expo SDK `54` (Expo Router v6, typed routes)
- TypeScript (strict)
- TanStack Query for server state
- `@nkzw/create-context-hook` for typed contexts
- `expo-router`, `expo-linear-gradient`, `expo-image`, `expo-image-picker`, `expo-av`, `expo-haptics`, `expo-secure-store`, `react-native-safe-area-context`, `react-native-gesture-handler`
- `lucide-react-native` icons
- `zod` validation

**Backend**
- Hono server + tRPC v11 (`@trpc/server`, `@trpc/react-query`)
- Superjson transformer
- HMAC-SHA256 JWT-like tokens (Web Crypto API)
- In-memory user / assessment store (swap for Postgres / SQLite in production)

**AI**
- `@rork-ai/toolkit-sdk` (`useRorkAgent`, `createRorkTool`)

---

## Project Structure

```
.
├── expo/                          # React Native / Expo app
│   ├── app/                       # expo-router screens
│   │   ├── _layout.tsx            # Providers, ErrorBoundary, AuthGuard
│   │   ├── (tabs)/                # Home, Patterns, Chat, History, Profile
│   │   ├── auth/                  # login, signup, verify-email
│   │   ├── subscription/          # select-plan, payment
│   │   ├── assessment/            # upload, survey, screening, games, results
│   │   ├── onboarding.tsx
│   │   ├── modal.tsx
│   │   └── +not-found.tsx
│   ├── backend/                   # Hono + tRPC server
│   │   ├── hono.ts
│   │   ├── trpc/
│   │   │   ├── app-router.ts
│   │   │   ├── create-context.ts
│   │   │   └── routes/auth.ts
│   │   ├── db/users.ts            # in-memory store
│   │   └── utils/auth.ts          # token + password helpers
│   ├── components/MusicPlayer.tsx
│   ├── contexts/                  # AuthContext, SubscriptionContext, StudyScopeContext, MusicContext, ThemeContext
│   ├── constants/colors.ts        # light & dark themes
│   ├── mocks/                     # survey + screening question banks
│   ├── types/index.ts
│   ├── utils/personalization.ts
│   ├── lib/trpc.ts
│   ├── app.json / package.json / tsconfig.json
│   └── ...
├── rork.json
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) ≥ 1.1 (the repo uses `bun.lock`)
- iOS Simulator (Xcode) and/or Android Emulator (Android Studio), or just a browser

### Install
```bash
cd expo
bun install
```

### Run
```bash
# iOS / Android simulator (Expo Go)
bun run start

# Web
bun run start-web
```

Then press `i` for iOS, `a` for Android, or scan the QR code with Expo Go on a real device.

---

## Environment Variables

Public envs are exposed to the client via the `EXPO_PUBLIC_` prefix. Create an `.env` inside `expo/`:

```env
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-api-host.example.com
EXPO_PUBLIC_RORK_APP_KEY=...
EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY=...
EXPO_PUBLIC_PROJECT_ID=...
```

> No private keys are required for local development — the in-memory backend will run without external services.

---

## Scripts

From `expo/`:

| Command | What it does |
| --- | --- |
| `bun run start` | Start Metro + Expo CLI with tunnel |
| `bun run start-web` | Start the web build with tunnel |
| `bun run start-web-dev` | Same as above with verbose Expo logs |
| `bun run lint` | Run `expo lint` |

---

## Architecture

### State management
- **React Query** for any server-derived data (user, assessment, theme, music settings, streaks).
- **`@nkzw/create-context-hook`** for typed providers (`AuthProvider`, `SubscriptionProvider`, `StudyScopeProvider`, `MusicProvider`, `ThemeProvider`). No bare `createContext`, no Zustand/Redux.
- **AsyncStorage** persistence is encapsulated inside the relevant provider (never accessed in screens directly).
- **SecureStore** holds the auth token on native; `localStorage` on web.

### Routing & guards
`app/_layout.tsx` wires every provider, mounts a tRPC client, and wraps the navigator in an `AuthGuard` that:
1. Redirects unauthenticated users to `/auth/login`.
2. Redirects authenticated users without a plan to `/subscription/select-plan`.
3. Lets premium users into the tab navigator.

A class-based `ErrorBoundary` catches render errors and shows a recovery UI.

### Backend
- `backend/hono.ts` mounts the tRPC router under `/api/trpc`.
- `backend/trpc/create-context.ts` extracts a bearer token, verifies the HMAC signature, and exposes `userId` for `protectedProcedure`.
- `backend/trpc/routes/auth.ts` exposes `signup`, `verifyContact`, `resendVerificationCode`, `login`, `me`, `updateProfile`, `saveAssessment`, `getAssessment`, `resetAssessment`.
- The user store is in-memory (`Map`-based) for the demo. Swap `backend/db/users.ts` for any persistent DB — the public API stays the same.

### Scoring algorithm
- **Learning style** → weighted sum of survey options grouped by `visual / auditory / kinesthetic`.
- **Screening** → each question carries a category-specific weight; game results modulate scores (e.g. low accuracy on `word` game adds to dyslexia, slow average response time adds to processing speed). Final percentage is normalised against the max possible per category and bucketed into `none / mild / moderate / significant`.
- **Overall risk** → aggregates significant + moderate counts into `none / low / moderate / high`.
- **Strengths & recommendations** are generated from category percentages and per-game performance, then de-duplicated and capped.

---

## Subscription Plans

| Plan | Price | Duration | Personalization | History |
| --- | --- | --- | --- | --- |
| Free Trial | $0 | 1 day | ❌ | ❌ |
| Monthly | **$24.99 / month** | 30 days | ✅ | ✅ |
| Annual | **$274.99 / year** | 365 days (Save 8%) | ✅ | ✅ |

Plan, expiry date, and (encrypted on-device) card details live in `SubscriptionContext`. Users can switch plans at any time from Settings.

---

## Privacy & Disclaimer

- Data is stored on-device (AsyncStorage / SecureStore) and through the user's own backend.
- The screening flow is **not** a diagnosis. The disclaimer screen in `assessment/screening.tsx` makes this explicit before any question is shown. If significant indicators are found the app recommends consulting a qualified educational psychologist or learning specialist.

---

## License

MIT © StudyScope contributors.
