# Code Review — Chatbot Feature & Test Infrastructure

> **Scope:** PR #4 (`feature/chatbot`) + PR #5 (`tests integrated`)
> **Reviewer:** Senior Frontend Architect review
> **Date:** Jun 8, 2026
> **Branch / HEAD:** `main @ 3fbaab40`
> **Overall score:** **5 / 10** — product instinct is solid, implementation has correctness bugs, no a11y, no tests for new feature, no memoization, no code-splitting.

---

## Table of contents
1. [Executive summary](#executive-summary)
2. [Critical issues — fix before next push](#critical-issues)
3. [Detailed findings by rubric](#detailed-findings)
   1. [Code quality & readability](#1-code-quality--readability)
   2. [React best practices](#2-react-best-practices)
   3. [Performance](#3-performance)
   4. [TypeScript](#4-typescript)
   5. [Security](#5-security)
   6. [Accessibility (a11y)](#6-accessibility-a11y)
   7. [Error handling](#7-error-handling)
   8. [Testing](#8-testing)
4. [Bugs in non-chatbot files shipped under chatbot PR](#non-chatbot-bugs)
5. [Top 5 priorities](#top-5-priorities)
6. [Refactored snippets](#refactored-snippets)
7. [Action checklist](#action-checklist)

---

## Executive summary

| # | Area | Verdict |
|---|---|---|
| Chatbot UX | Polished visually, but multiple Tailwind classes silently no-op | ⚠️ |
| Chatbot logic | Keyword router has collisions; React keys collide on rapid input | 🛑 |
| Profile / Dashboard / MockTest (bundled in same PR) | Functional but several correctness gaps | ⚠️ |
| Tests | Vitest infra added, but new code has 0% coverage and existing tests are brittle | ⚠️ |
| Repo hygiene | Live SonarQube token committed; `coverage/` directory tracked | 🛑 |
| Accessibility | Customer-facing widget has no `role="dialog"`, no live region, icon buttons unlabeled | 🛑 |

Severity legend: **Critical** = fix before next push · **High** = real bug, will bite users · **Medium** = correctness / brittle · **Low** = nit / cleanup

---

## Critical issues

### C1 — Live SonarQube token committed to repo
**File:** `sonar-project.properties`

```properties
sonar.host.url=http://localhost:9000
sonar.token=sqp_ac5429c6a6cba939fe28ed0eecf6567342f4837c
```

Even though the host is `localhost`, the token is now in git history forever. Anyone who clones can hit any SonarQube instance with it.

**Action:**
1. Revoke the token in SonarQube **now**.
2. Scrub it from history with `git filter-repo` or BFG (a plain delete-commit is not enough — `git log` still has it).
3. Move to `SONAR_TOKEN` env var read by the scanner.
4. Drop the Windows-specific paths (`C:/Program Files/nodejs/node.exe`, `C:/Users/acer/AppData/Local/Temp/sonar-work`) or move them to a gitignored `sonar-project.properties.local`.

### C2 — `coverage/` directory committed (84 KB of generated artifacts)
HTML report, PNGs, JSON outputs all tracked. Will balloon and create noisy diffs.

**Action:**
```bash
echo "coverage/" >> .gitignore
git rm -r --cached coverage/
git commit -m "chore: stop tracking coverage outputs"
```

While in `.gitignore`, also add:
```gitignore
.vitest-cache/
.DS_Store
```

### C3 — Chatbot keyword router misroutes any message containing "plan"
**File:** `src/components/chatbot/chatbotFlows.ts`

```ts
export const keywordFlowMap: { keywords: string[]; nextId: string }[] = [
  { keywords: ['price', 'pricing', 'plan', ...], nextId: 'pricing' },
  ...
  { keywords: ['study', 'plan', 'schedule', 'practice', '79', 'tips', 'daily'], nextId: 'study_plans' },
];
```

`'plan'` lives in **both** `pricing` and `study_plans`. The loop is first-match-wins, so:

- The **"Study Plans" quick-reply button** routes to the **pricing** flow.
- "I need a study plan" → pricing.
- `'pro'` matches inside "**pro**file/**pro**duct/im**pro**ve"; `'tech'` matches inside "high-**tech**".

**Action:** deduplicate keywords, list specific routes first, and switch to word-boundary regex (see [Refactored snippets](#refactored-snippets)).

### C4 — Duplicate React keys via `Date.now()` IDs
**File:** `src/components/chatbot/ChatWidget.tsx`

```ts
const userMsg: Message = { id: `user-${Date.now()}`, ... };
const typingId = `typing-${Date.now()}`;
const botMsg = { id: `bot-${Date.now()}`, ... };
```

Two events in the same millisecond (rapid clicks, React 18 batched updates) produce identical keys → React duplicate-key warnings AND `setMessages(prev => prev.filter(m => m.id !== typingId))` can remove the **wrong** bubble.

**Action:**
```ts
let __seq = 0;
const nextId = (prefix: string) => `${prefix}-${++__seq}-${Date.now()}`;
```

---

## Detailed findings

## 1. Code quality & readability

### Q1 — [High] Massive duplication across handlers
`handleOptionSelect`, `handleBackSelect`, `handleHomeSelect`, `handleSendMessage` all repeat the same 4-step ritual:
push user message → push typing bubble → `setTimeout` → replace typing with bot reply.
~70% identical code, ~120 LOC of pure duplication.

**Fix:** extract a single `speak(text, delay)` helper or, better, a `useReducer` hook (see [Refactored snippets](#refactored-snippets)).

### Q2 — [Medium] Two structurally identical `Option` types
- `chatbotFlows.ts` exports `FlowOption`.
- `OptionButtons.tsx` exports `Option`.
- `ChatWidget.tsx` imports `Option` from `chatbotFlows`.

Same shape, two declarations. Re-export one from a single source.

### Q3 — [Medium] Folder structure breaks the project's Atomic Design
The rest of `src/components/` uses `atoms/`, `molecules/`, `organisms/`. Chatbot is dumped flat in `components/chatbot/`. Suggested move:

```
components/molecules/MessageBubble.tsx
components/molecules/OptionButtons.tsx
components/organisms/ChatWindow.tsx
components/organisms/ChatWidget.tsx
data/chatbotFlows.ts
```

### Q4 — [Low] `ChatSupport.tsx` is a 5-line passthrough
```tsx
export function ChatSupport() { return <ChatWidget />; }
```
Delete; import `ChatWidget` directly.

### Q5 — [Low] `chatbotFlows.ts` is 498 lines of mixed data
Split per topic (`flows/pricing.ts`, `flows/speaking.ts`, …) with an `index.ts` aggregator to reduce merge conflicts as content grows.

### Q6 — [Low] `isLargeSet` reads as a boolean about something other than layout
Rename to `useGridLayout` or `useTwoColumnLayout` in `OptionButtons.tsx`.

---

## 2. React best practices

### R1 — [High] Handlers recreated each render → no memoized children
Every keystroke in the input causes `ChatWidget` to re-render, which recreates all four handlers, which forces every `MessageBubble` to re-render. Wrap handlers in `useCallback`, wrap `MessageBubble` in `React.memo`, and memoize the parsed markdown.

### R2 — [High] State machine logic belongs in `useReducer`
`nodeId` + `historyStack` + `messages` always mutate together. Four handlers each repeat the transition logic. A reducer compresses everything to ~25 lines and makes transitions independently testable.

### R3 — [Medium] Auto-scroll missing `block: 'nearest'` & reduced-motion guard
**File:** `src/components/chatbot/ChatWindow.tsx`
```ts
messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
```
Without `block: 'nearest'`, this scrolls the **parent page** when the chat is partially off-screen. And `'smooth'` ignores `prefers-reduced-motion`.

```ts
const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
messagesEndRef.current?.scrollIntoView({
  behavior: prefersReduced ? 'auto' : 'smooth',
  block: 'nearest',
});
```

### R4 — [Medium] `setTimeout` not cleared on close / unmount
None of the four handlers register cleanup. If the user closes the widget mid-typing, the timer still fires and pushes a bot message into hidden state. Track timers in a `useRef<Set<number>>` and clear in `useEffect`'s cleanup and inside `handleClose`.

### R5 — [Medium] Race condition: `nodeId` advances before typing finishes
`handleOptionSelect` updates `nodeId` synchronously (line 47) and schedules the response on a 750ms timer. The bottom panel re-renders to show the **next** node's options while the bot is "typing" the **previous** answer. Disable option buttons while `isTyping`, or render new options only after the setTimeout resolves.

### R6 — [Low] Welcome message timestamp frozen at mount
```ts
const [messages, setMessages] = useState<Message[]>([
  { id: 'welcome', text: chatbotFlows.home.text, sender: 'bot', time: getCurrentTime() },
]);
```
If the user opens the app at 9 AM and the chatbot at 5 PM, the welcome stamp says 9 AM. Initialize lazily on first `handleOpen`.

---

## 3. Performance

### P1 — [High] Chatbot ships in the initial bundle
~1.5K LOC + flows + markdown parser load even when no user opens the chat. Code-split:

```tsx
const ChatWidget = React.lazy(() => import('@/components/chatbot/ChatWidget'));

<Suspense fallback={null}><ChatWidget /></Suspense>
```

Bonus: defer mount until first user interaction (`requestIdleCallback` or scroll).

### P2 — [High] Every message re-renders on every state change
Already covered in R1. With long chat history this is visible.

### P3 — [Medium] `parseMarkdown` runs in render
Heavy regex + array work on every render. Move into `useMemo` keyed on `message.text`.

### P4 — [High] Dead Tailwind utility classes silently no-op
Tailwind v4 + `tw-animate-css` does not provide bare `animate-fade-in` or `animate-scale-up` — confirmed by inspecting `node_modules/tw-animate-css/dist/`. Both classes are no-ops; intended animations don't run.

Also non-existent color/scale values used across chatbot files:

| Class | Status |
|---|---|
| `animate-fade-in`, `animate-scale-up` | No-op (use `animate-in fade-in`, `animate-in zoom-in-95`) |
| `gray-150`, `gray-650`, `gray-750`, `gray-850` | No-op (only `950` is real) |
| `purple-750`, `from-purple-750`, `to-purple-750` | No-op |
| `border-gray-150`, `text-gray-650`, `text-gray-750`, `text-gray-850` | No-op |
| `hover:scale-103`, `active:scale-97` | No-op (use 105/95 or arbitrary `[1.03]`) |
| `duration-255` | Likely no-op |

Either stick to the default scale, or define custom shades in `theme.css`.

---

## 4. TypeScript

### T1 — [Medium] `Message.id: string | number` — drop the union
Never used as number. Restrict to `string`.

### T2 — [Medium] `parseInlineMarkdown` return type is awkward
```ts
function parseInlineMarkdown(text: string): React.ReactNode[] | string
```
Always return `ReactNode[]` — React renders an array fine.

### T3 — [Medium] Loose `nextId: string`
With `chatbotFlows: Record<string, FlowNode>`, every navigation ID is unchecked. Tighten to a union and gain compile-time safety:

```ts
const chatbotFlows = { home: { ... }, pricing: { ... }, ... } as const;
export type FlowId = keyof typeof chatbotFlows;
export interface FlowOption { label: string; nextId: FlowId; }
```

Now `nextId: 'priceing'` fails to compile, and the runtime fallback `|| chatbotFlows.home` becomes unreachable.

### T4 — [Medium] `pagination.tsx` uses global `JSX.Element`
**File:** `src/lib/pagination.tsx`
```ts
export function highlightText(...): JSX.Element {
```
`@types/react@19.2` moves `JSX` under `React.JSX` in stricter setups. Safer:
```ts
import type { ReactElement } from 'react';
export function highlightText(...): ReactElement {
```

### T5 — [Low] No `any` in chatbot files. Clean.

---

## 5. Security

### S1 — [Critical] Hardcoded SonarQube token (see [C1](#c1--live-sonarqube-token-committed-to-repo))

### S2 — [Medium] No input length cap in chatbot
A user pasting 10 MB freezes the renderer. Cap at 500 chars:
```tsx
<input maxLength={500} ... />
```

### S3 — [Medium] `keywordFlowMap` substring matching (also a security hygiene issue)
`'pro'` matches inside many unrelated words. Use word boundaries. Covered in [C3](#c3--chatbot-keyword-router-misroutes-any-message-containing-plan).

### S4 — [Low] Markdown parser builds React elements, not HTML — no XSS today
User text rendered as `<p>` (React escapes). Bot text comes from hardcoded `chatbotFlows.ts`. If bot text ever comes from a server, add a sanitization pass first.

---

## 6. Accessibility (a11y)

### A1 — [High] Chat panel has no `role` or label
`ChatWindow` is a `<div>`. AT users have no idea a dialog opened.

```tsx
<div role="dialog" aria-modal="false" aria-labelledby="chatbot-title">
  <h2 id="chatbot-title" className="sr-only">PTE Study Assistant chat</h2>
  ...
```

### A2 — [High] Message list is not a live region
New bot messages are silent for AT users.

```tsx
<div role="log" aria-live="polite" aria-atomic="false" aria-relevant="additions">
  {messages.map(...)}
</div>
```

### A3 — [High] Send / Minimize / Close buttons missing `aria-label`
`title` alone is not enough for AT.

```tsx
<button aria-label="Send message"><Send /></button>
<button aria-label="Minimize chat"><Minimize2 /></button>
<button aria-label="Close chat"><X /></button>
```

### A4 — [High] Input has placeholder but no `<label>`
```tsx
<label htmlFor="chatbot-input" className="sr-only">Type your message</label>
<input id="chatbot-input" ... />
```

### A5 — [Medium] Esc to close not wired up
```tsx
useEffect(() => {
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [onClose]);
```

### A6 — [Medium] No focus management on open/close
On open: focus the input. On close: return focus to the trigger button.

### A7 — [Medium] Color contrast risk
`text-[10px]` / `text-[11px]` with `text-gray-400` on white ≈ 3:1 — fails WCAG AA. Bump to `text-gray-600`/`text-gray-700`.

### A8 — [Medium] `prefers-reduced-motion` ignored
`animate-bounce`, `animate-ping`, `animate-pulse` always run. Gate with `motion-safe:` prefix.

---

## 7. Error handling

### E1 — [High] No error boundary around `ChatWidget`
Project already has `src/components/organisms/ErrorBoundary.tsx`. Wrap:
```tsx
<ErrorBoundary fallback={<div>Chat unavailable</div>}>
  <ChatWidget />
</ErrorBoundary>
```

### E2 — [Medium] Missing-node fallback is silent
```ts
const nextNode = chatbotFlows[nextNodeId] || chatbotFlows.home;
```
A typo throws the user back to home with no warning. Either type-check `nextId` (T3) or `console.warn` + show a "lost the thread" message.

### E3 — [Medium] Long bot messages can overflow
No `max-h` on the bubble. A 1000-word reply blows out the layout.
```tsx
<div className="... max-h-[400px] overflow-y-auto">
```

### E4 — [Medium] `setTimeout` callbacks not wrapped in try/catch
If `setMessages` throws, error swallows silently.

---

## 8. Testing

### TS1 — [Critical for sustainability] 0% coverage on the new chatbot feature
PR #5 added vitest infra. Chatbot was the perfect candidate — pure data + pure parser + (after R2) pure reducer. None of it is tested.

**Missing suites:**

| Suite | Cases |
|---|---|
| `parseInlineMarkdown` | no `**`, single pair, nested pairs, unbalanced `**`, escaped asterisks |
| `parseMarkdown` | h1/h2, bullet `* `/`- `, numbered list, table w/ divider, table w/o divider, blank lines, mixed content |
| `keywordFlowMap` routing | each intent routes correctly, "study plan" → `study_plans`, empty/whitespace falls back |
| `chatReducer` (after R2 extraction) | option select, go back from depth 1, go back from home (noop), home from home (noop), keyword match, keyword miss |
| `ChatWidget` integration | open/close, send-and-receive flow, back/home buttons, focus management, escape closes, ARIA roles present |

### TS2 — [High] `LoginPage.test.tsx` has silent-pass + leaked state + misleading assertion

```ts
// silent-pass: if eyeButton isn't found, the test passes with zero assertions
const eyeButton = toggleButtons.find((b) => b.getAttribute("type") === "button" && !b.textContent);
if (eyeButton) {
  fireEvent.click(eyeButton);
  ...
}
```
Add `expect(eyeButton).toBeDefined()` before the `if`.

```ts
// misleading: name says "disables submit button" but only checks label text
it("disables submit button while loading", async () => {
  ...
  expect(screen.getByRole("button", { name: /logging in/i })).toBeDefined();
});
```
Add `expect(btn).toBeDisabled()`.

**Test pollution:** `localStorage.setItem("user", …)` is never cleared. Add to every suite:
```ts
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
```

### TS3 — [Medium] `pagination.test.tsx` thin
Only tests `highlightText` with a contiguous match and an empty query. Add:
- No-match input returns full text.
- Multiple non-adjacent matches.
- Empty/`undefined` text input.
- `buildPageList` edge cases: `currentPage > totalPages`, `currentPage < 1`.

### TS4 — [Medium] `highlightText` uses stateful global regex with `.test()`
```ts
const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
const parts = safeText.split(regex);
return <>{parts.map((part, i) => regex.test(part) ? <mark>...</mark> : part)}</>;
```
`g`-flagged regex objects keep `lastIndex` state. `.test()` mutates it. Currently works because `.test()` resets on no-match, but it's a classic footgun. Compare directly instead:
```ts
const lower = query.toLowerCase();
parts.map((part, i) => part.toLowerCase() === lower ? <mark key={i}>{part}</mark> : part)
```

---

## Non-chatbot bugs

> These shipped under PR #4 (`feature/chatbot`) and PR #5, despite being unrelated. Process concern: split unrelated work into focused PRs with matching branch names.

### N1 — [High] `Profile` defaults `dialCode` to `+1` for non-US users
**File:** `src/pages/ProfilePage.tsx`
```ts
dialCode: detectedDialCode || '+1',
```
If user has no country and no phone yet, dial input shows `+1`. They type their Indian number, save → backend persists `+11234567890`. Either keep `dialCode` empty and block save when phone is set but dialCode is empty.

### N2 — [High] Dashboard denominator can be 0
```ts
const activeTestsCount = dbTests.filter(t => t.STATUS === 'active').length;
...
<div>{dashboardData?.mockTestsCompleted || 0}/{activeTestsCount}</div>
```
Renders "0/0" when no tests are published. Hide or fall back to a friendlier copy. Also `text-gray-650` is a no-op shade (see P4).

### N3 — [Medium] `useEffect` in Dashboard missing `user` dep
```ts
useEffect(() => { fetchDashboardData(); }, []);
```
On logout→login without reload, dashboard keeps stale data.

### N4 — [Medium] IP geo auto-detect has no fallback / no abort
**File:** `src/pages/ProfilePage.tsx`
- `ipapi.co` free tier rate-limits to 1000/day per IP and blocks several regions.
- No `AbortController`; setState fires on unmounted component.
- `setHasGeoFetched(true)` is set **before** the await — if the call fails, user has no retry.

### N5 — [Medium] Bundling unrelated changes under "chatbot" PR
PR #4 ships Dashboard refactors, Profile editable dial code, geo auto-detect, MockTestPage pending-attempt filtering. PR #5 ships tests + SectionQuestionsPage refactor + Sonar config. None of these touch the chatbot. Reviewing is painful; rollbacks are risky. Split into focused PRs.

---

## Top 5 priorities

1. **Revoke + rotate the SonarQube token; scrub git history.** Then add `coverage/` to `.gitignore` and `git rm -r --cached coverage/`.
2. **Extract `useChatBot` hook + `chatReducer`.** Collapses 200 LOC of handlers into ~50 LOC of pure logic that's trivially testable and eliminates duplication.
3. **Stable unique IDs + `setTimeout` cleanup.** Kills the React key-collision class of bugs and the "ghost message after close" bug.
4. **Accessibility pass.** Add `role="dialog"`, live region, aria-labels on icon buttons, label for input, Esc-to-close, focus management. Non-negotiable for a customer-facing widget.
5. **Memoize `MessageBubble` + `parseMarkdown`, lazy-load `ChatWidget`, add the test pyramid** (parser → reducer → component integration).

---

## Refactored snippets

### Unique IDs + timer registry
```ts
let __chatSeq = 0;
export const nextId = (prefix: string) => `${prefix}-${++__chatSeq}-${Date.now()}`;
```

### `useChatBot` hook (replaces all four handlers + state)
```ts
import { useReducer, useCallback, useEffect, useRef } from 'react';
import { chatbotFlows, type FlowId, type FlowOption } from './chatbotFlows';
import { matchKeyword } from './matchKeyword';
import { nextId } from './id';

const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

type State = {
  messages: Message[];
  nodeId: FlowId;
  history: FlowId[];
  isTyping: boolean;
};

type Action =
  | { type: 'PUSH'; msg: Message }
  | { type: 'REPLACE_TYPING'; typingId: string; with: Message }
  | { type: 'NAVIGATE'; to: FlowId; push: boolean }
  | { type: 'POP' }
  | { type: 'RESET_TO_HOME' }
  | { type: 'SET_TYPING'; value: boolean };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'PUSH':
      return { ...s, messages: [...s.messages, a.msg] };
    case 'REPLACE_TYPING':
      return {
        ...s,
        messages: s.messages.filter(m => m.id !== a.typingId).concat(a.with),
      };
    case 'NAVIGATE':
      return { ...s, nodeId: a.to, history: a.push ? [...s.history, a.to] : s.history };
    case 'POP': {
      if (s.history.length <= 1) return s;
      const h = s.history.slice(0, -1);
      return { ...s, history: h, nodeId: h[h.length - 1] };
    }
    case 'RESET_TO_HOME':
      return { ...s, nodeId: 'home', history: ['home'] };
    case 'SET_TYPING':
      return { ...s, isTyping: a.value };
  }
}

export function useChatBot() {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    nodeId: 'home' as FlowId,
    history: ['home' as FlowId],
    isTyping: false,
    messages: [{
      id: nextId('welcome'), text: chatbotFlows.home.text,
      sender: 'bot' as const, time: getTime(),
    }],
  }));

  const timers = useRef(new Set<number>());

  const speak = useCallback((text: string, delay = 750) => {
    const typingId = nextId('typing');
    dispatch({ type: 'PUSH', msg: {
      id: typingId, text: '', sender: 'bot', time: getTime(), isTyping: true,
    }});
    dispatch({ type: 'SET_TYPING', value: true });
    const t = window.setTimeout(() => {
      dispatch({
        type: 'REPLACE_TYPING',
        typingId,
        with: { id: nextId('bot'), text, sender: 'bot', time: getTime() },
      });
      dispatch({ type: 'SET_TYPING', value: false });
      timers.current.delete(t);
    }, delay);
    timers.current.add(t);
  }, []);

  const userMsg = useCallback((text: string) => {
    dispatch({ type: 'PUSH', msg: {
      id: nextId('user'), text, sender: 'user', time: getTime(),
    }});
  }, []);

  const selectOption = useCallback((opt: FlowOption) => {
    userMsg(opt.label);
    dispatch({ type: 'NAVIGATE', to: opt.nextId, push: true });
    speak(chatbotFlows[opt.nextId].text, 750);
  }, [speak, userMsg]);

  const goBack = useCallback(() => {
    if (state.history.length <= 1) return;
    userMsg('Go Back ↩');
    dispatch({ type: 'POP' });
    const prev = state.history[state.history.length - 2];
    speak(chatbotFlows[prev].text, 500);
  }, [state.history, speak, userMsg]);

  const goHome = useCallback(() => {
    if (state.nodeId === 'home') return;
    userMsg('Back to Main Menu 🏠');
    dispatch({ type: 'RESET_TO_HOME' });
    speak(chatbotFlows.home.text, 600);
  }, [state.nodeId, speak, userMsg]);

  const sendText = useCallback((text: string) => {
    const trimmed = text.trim().slice(0, 500);
    if (!trimmed) return;
    userMsg(trimmed);
    const matchedId = matchKeyword(trimmed);
    if (matchedId) {
      dispatch({ type: 'NAVIGATE', to: matchedId, push: true });
      speak(chatbotFlows[matchedId].text, 850);
    } else {
      speak(
        "I couldn't find a direct match. Please pick an option below or try keywords like 'pricing', 'mock tests', 'speaking'.",
        850
      );
    }
  }, [speak, userMsg]);

  useEffect(() => () => {
    timers.current.forEach(t => clearTimeout(t));
    timers.current.clear();
  }, []);

  return { state, actions: { selectOption, goBack, goHome, sendText } };
}
```

### Safer keyword matcher (word boundaries + priority order)
```ts
type Route = { id: FlowId; pattern: RegExp };

const routes: Route[] = (
  [
    { id: 'study_plans', words: ['study plan', 'study schedule', 'practice plan', 'daily plan', '30 day', '79+'] },
    { id: 'pricing',     words: ['price', 'pricing', 'cost', 'subscription', 'buy', 'premium plan', 'basic plan', 'pro plan', 'compare plans'] },
    { id: 'mock_tests',  words: ['mock', 'full length', 'sectional', 'score report'] },
    { id: 'speaking',    words: ['speaking', 'read aloud', 'repeat sentence', 'describe image', 'retell lecture'] },
    { id: 'writing',     words: ['writing', 'essay', 'summarize written', 'swt', 'template'] },
    { id: 'reading',     words: ['reading', 'fill in the blank', 'fib', 'reorder', 'mcq'] },
    { id: 'listening',   words: ['listening', 'note taking', 'incorrect word', 'dictation', 'wfd', 'sst'] },
    { id: 'scoring',     words: ['scoring', 'grading', 'evaluation'] },
    { id: 'account',     words: ['account', 'password', 'forgot password', 'login', 'cancel subscription', 'payment'] },
    { id: 'technical',   words: ['technical', 'microphone', 'audio', 'browser', 'slow site'] },
    { id: 'contact',     words: ['contact', 'support email', 'whatsapp', 'human agent', 'timings'] },
  ] as const
).map(r => ({
  id: r.id,
  pattern: new RegExp(
    `\\b(${r.words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'i'
  ),
}));

export function matchKeyword(input: string): FlowId | null {
  for (const r of routes) if (r.pattern.test(input)) return r.id;
  return null;
}
```

### Memoized `MessageBubble`
```tsx
import { memo, useMemo } from 'react';

export const MessageBubble = memo(function MessageBubble({ message }: { message: Message }) {
  const body = useMemo(() => {
    if (message.isTyping) return <TypingDots />;
    if (message.sender === 'user') {
      return <p className="text-sm leading-relaxed">{message.text}</p>;
    }
    return parseMarkdown(message.text);
  }, [message.text, message.sender, message.isTyping]);

  return (/* ... bubble shell using `body` ... */);
});
```

### Lazy-load the widget
```tsx
import { lazy, Suspense } from 'react';
const ChatWidget = lazy(() => import('@/components/chatbot/ChatWidget'));

<Suspense fallback={null}>
  <ChatWidget />
</Suspense>
```

### Accessible chat window shell
```tsx
<div
  role="dialog"
  aria-modal="false"
  aria-labelledby="chatbot-title"
  className="..."
>
  <header>
    <h2 id="chatbot-title" className="sr-only">PTE Study Assistant chat</h2>
    ...
    <button aria-label="Minimize chat" onClick={onMinimize}><Minimize2 /></button>
    <button aria-label="Close chat" onClick={onClose}><X /></button>
  </header>

  <div role="log" aria-live="polite" aria-atomic="false" aria-relevant="additions">
    {messages.map(m => <MessageBubble key={m.id} message={m} />)}
    <div ref={messagesEndRef} />
  </div>

  <form onSubmit={e => { e.preventDefault(); handleSend(); }}>
    <label htmlFor="chatbot-input" className="sr-only">Type your message</label>
    <input id="chatbot-input" maxLength={500} ... />
    <button aria-label="Send message" type="submit"><Send /></button>
  </form>
</div>
```

---

## Action checklist

### Repo hygiene (do this first)
- [ ] Revoke SonarQube token in dashboard.
- [ ] Scrub token from git history (`git filter-repo` / BFG).
- [ ] Switch Sonar config to env-var-based.
- [ ] Add `coverage/`, `.vitest-cache/`, `.DS_Store` to `.gitignore`.
- [ ] `git rm -r --cached coverage/`.

### Chatbot — critical
- [ ] Fix `keywordFlowMap` collisions (use word boundaries; specific routes first).
- [ ] Replace `Date.now()` IDs with unique IDs + timer cleanup.
- [ ] Extract `useChatBot` + `chatReducer`.
- [ ] Remove dead Tailwind classes (`animate-fade-in`, `animate-scale-up`, `gray-150/650/750/850`, `purple-750`, `scale-103/97`, `duration-255`).

### Chatbot — a11y
- [ ] Add `role="dialog"` + `aria-labelledby` to chat panel.
- [ ] Add `role="log"` + `aria-live="polite"` to messages list.
- [ ] Add `aria-label` to Send, Minimize, Close buttons.
- [ ] Add `<label htmlFor="chatbot-input">`.
- [ ] Wire Esc-to-close.
- [ ] Restore focus to trigger on close.
- [ ] Use `motion-safe:` prefix on animations.

### Chatbot — perf
- [ ] `React.memo(MessageBubble)`.
- [ ] `useMemo(parseMarkdown)`.
- [ ] `React.lazy(ChatWidget)`.

### Tests
- [ ] `parseInlineMarkdown` / `parseMarkdown` unit suites.
- [ ] `matchKeyword` routing suite.
- [ ] `chatReducer` suite (after extraction).
- [ ] `ChatWidget` integration suite.
- [ ] Fix `LoginPage` silent-pass and add `beforeEach(localStorage.clear)`.
- [ ] Expand `pagination.test.tsx` (no-match, edge cases).

### Non-chatbot follow-ups
- [ ] Profile: empty `dialCode` default + save validation.
- [ ] Dashboard: handle `activeTestsCount === 0` case.
- [ ] Dashboard: add `user?.id` to refetch effect deps.
- [ ] Profile: `AbortController` on `ipapi.co` fetch + fallback provider.
- [ ] Process: split future PRs by feature; rename branches accordingly.
