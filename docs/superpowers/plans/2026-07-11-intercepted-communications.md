# Intercepted Communications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the right-column quote widget with rotating, data-driven intercepted conversation transcripts.

**Architecture:** Keep the existing Wolves page and navigation behavior in `src/WolvesApp.vue`, replace its quote data import with a typed JSON conversation collection, and render the active conversation as ordered terminal-log message rows. Reuse the existing wrap-around controls, keyboard handling, auto-rotation timer, sticky layout, and transition.

**Tech Stack:** Vue 3, TypeScript, Vue SFC scoped SCSS, JSON module imports, Vitest, ESLint, Vite.

## Global Constraints

- Conversation data lives in `src/data/intercepted-communications.json`.
- Each conversation has `title`, `channel`, `date`, and ordered `messages`.
- Each message has `speaker` and `text`, with optional `timestamp`.
- Existing previous/next buttons and ArrowLeft/ArrowRight controls rotate conversations with wrap-around.
- Manual navigation resets the nine-second automatic rotation timer.
- Preserve sticky right-column behavior, responsive layout, and accessibility labels.

---

### Task 1: Add conversation data and schema

**Files:**
- Create: `src/data/intercepted-communications.json`
- Modify: `src/WolvesApp.vue:21-35`

**Interfaces:**
- Produces `InterceptedConversation[]` with `title`, `channel`, `date`, and `messages`.
- Produces `InterceptedMessage` with `speaker`, `text`, and optional `timestamp`.

- [ ] **Step 1: Create representative conversation data**

Create a JSON array containing at least three conversations, each with two or more ordered messages. Use fictional intercept metadata and concise transcript text so the renderer demonstrates timestamps both present and absent.

- [ ] **Step 2: Define TypeScript interfaces and import the new file**

Replace the quote interface/import with:

```ts
import interceptedCommunications from './data/intercepted-communications.json'

interface InterceptedMessage {
  speaker: string
  text: string
  timestamp?: string
}

interface InterceptedConversation {
  title: string
  channel: string
  date: string
  messages: InterceptedMessage[]
}

const conversations = interceptedCommunications as InterceptedConversation[]
```

- [ ] **Step 3: Run the type checker**

Run `npm run build`.

Expected: the build reaches Vite bundling without JSON/type errors; the UI may still reference removed quote fields until Task 2.

- [ ] **Step 4: Commit the data/schema change**

```bash
git add src/data/intercepted-communications.json src/WolvesApp.vue
git commit -m "feat: add intercepted communications data"
```

### Task 2: Render the intercepted communications panel

**Files:**
- Modify: `src/WolvesApp.vue:318-350`
- Modify: `src/WolvesApp.vue:644-715`

**Interfaces:**
- Consumes `conversations`, `currentConversationIndex`, and `currentConversation`.
- Produces the existing navigation behavior through `conversationNext()` and `conversationPrev()`.

- [ ] **Step 1: Replace quote state with conversation state**

Use:

```ts
const currentConversationIndex = ref(0)
const currentConversation = computed(() => conversations[currentConversationIndex.value] ?? null)
```

Update timer and navigation helpers to use `conversations.length` and the conversation index. Keep wrap-around behavior and restart the timer after manual navigation.

- [ ] **Step 2: Update keyboard navigation**

When `readingMode` is `flip`, preserve comic page arrow behavior. Otherwise, map ArrowLeft/ArrowRight to conversation navigation. Preserve the existing input, select, textarea, and contenteditable guard.

- [ ] **Step 3: Replace the widget template**

Render:

```vue
<p class="intercept-command">
  nimbinatus@blue-universal:~$ monitor --channel {{ currentConversation.channel }}
</p>

<h2>
  Intercepted Communications
</h2>

<p class="intercept-status">
  SIGNAL: CAPTURED<br>
  DATE: {{ currentConversation.date }}<br>
  CHANNEL: {{ currentConversation.channel }}
</p>

<h3>
  {{ currentConversation.title }}
</h3>

<div v-for="(message, index) in currentConversation.messages" :key="`${currentConversationIndex}-${index}`" class="intercept-message">
  <time v-if="message.timestamp">{{ message.timestamp }}</time>
  <span class="intercept-speaker">{{ message.speaker }}:</span>
  <span>{{ message.text }}</span>
</div>
```

Keep the visible previous/next buttons in the widget’s top-right and update their labels to “Previous conversation” and “Next conversation.”

- [ ] **Step 4: Run focused checks**

Run `npm run lint -- --no-fix && npm run build`.

Expected: no lint errors and a successful production build.

- [ ] **Step 5: Commit the rendered panel**

```bash
git add src/WolvesApp.vue
git commit -m "feat: render intercepted communications panel"
```

### Task 3: Style transcript rows and validate behavior

**Files:**
- Modify: `src/WolvesApp.vue:1370-1590`

**Interfaces:**
- Styles `.intercept-plan-content`, `.intercept-command`, `.intercept-status`, `.intercept-title`, `.intercept-message`, `.intercept-timestamp`, and `.intercept-speaker`.
- Leaves sticky, bottom-aligned desktop behavior unchanged.

- [ ] **Step 1: Replace quote-specific styling**

Use monospace typography throughout the header and transcript. Give each message a subtle divider, fixed-width optional timestamp column, highlighted speaker label, readable wrapping, and terminal-like muted/blue colors. Keep the widget controls absolutely positioned at its top-right.

- [ ] **Step 2: Remove quote-only selectors**

Remove unused quote text, quote metadata, quote symbol, and quote transition selectors once the new transcript markup no longer uses them. Preserve the existing transition classes if the conversation panel still uses the fade transition.

- [ ] **Step 3: Run the full repository checks**

Run:

```bash
npm run lint -- --no-fix
npm run test:run
npm run build
```

Expected: lint exits 0, all Vitest tests pass, and Vite reports a successful build.

- [ ] **Step 4: Commit the completed panel**

```bash
git add src/WolvesApp.vue
git commit -m "style: present intercepted communications as terminal log"
```
