# Build Progress & Live Development with Vite

This guide explains how to use the Vite dev server during development and how to see build progress in real-time.

## Quick Start

### Starting the Dev Server

Run the following command from the `dinolab/web` directory:

```bash
npm run dev
```

This starts the Vite development server with hot module replacement (HMR) enabled. The server will compile your code and watch for changes automatically.

## What You'll See in the Terminal

When the dev server starts successfully, your terminal output will look like this:

```
  VITE v5.0.0  ready in 245 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

**Key information:**
- **Local URL**: `http://localhost:5173/` — this is where your app is running
- **Ready time**: Shows how long it took to start the dev server
- **Port**: Default is 5173 (if unavailable, Vite will use the next available port)

### Opening Your App

Open your browser and navigate to `http://localhost:5173/`. You should see your application running.

## Hot Module Replacement (HMR) — Live Updates

HMR is the core feature of the dev server. When you save a file, Vite automatically:

1. **Detects the change** in your source code
2. **Recompiles only the changed module** (very fast)
3. **Sends the update to the browser** over a WebSocket connection
4. **Replaces the module in memory** without a full page reload
5. **Preserves your app state** (form inputs, scroll position, etc.)

### Terminal Output During HMR

When you save a file, you'll see output like:

```
  ✓ src/components/Button.tsx updated (45ms)

  [HMR] src/components/Button.tsx
```

Or for multiple files:

```
  ✓ src/styles/theme.css updated (12ms)
  ✓ src/utils/helpers.ts updated (28ms)

  [HMR] src/styles/theme.css
  [HMR] src/utils/helpers.ts
```

**What this means:** Your changes are live in the browser — no manual refresh needed.

## TypeScript Errors & Browser Overlay

If you have a TypeScript error or syntax issue, Vite will:

1. **Show an error in the terminal:**

```
  ✗ src/components/Button.tsx
  error TS2322: Type 'string' is not assignable to type 'number'
    at line 15, column 8
```

2. **Display an error overlay in the browser:**

```
┌─────────────────────────────────────────────────────────┐
│ Vite Error                                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ✗ src/components/Button.tsx                             │
│ error TS2322: Type 'string' is not assignable to type  │
│ 'number'                                                │
│                                                         │
│ 15 |   const count: number = "5";                        │
│    |                         ^^^                         │
│                                                         │
│ [Fix the error and save to see changes]                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**What to do:**
- Read the error message carefully
- Fix the issue in your editor
- Save the file
- The overlay will disappear and HMR will apply the fix

## Clearing the Vite Cache

In rare cases, Vite's cache may become stale or corrupted. To clear it:

### Option 1: Delete the Vite Cache Directory

```bash
rm -rf node_modules/.vite
```

On Windows (PowerShell):

```powershell
Remove-Item -Recurse -Force node_modules\.vite
```

### Option 2: Full Clean Install

If clearing just the cache doesn't help:

```bash
rm -rf node_modules
rm package-lock.json  # or yarn.lock / pnpm-lock.yaml
npm install
npm run dev
```

**When to clear the cache:**
- Changes aren't appearing in the browser even after saving
- You see strange TypeScript errors that don't match your code
- The dev server is behaving unexpectedly
- After switching branches or pulling major changes

## Development Workflow

### 1. Start the Dev Server

```bash
npm run dev
```

### 2. Open Your App

Navigate to `http://localhost:5173/` in your browser.

### 3. Make Changes

Edit your source files in your editor. Vite watches for changes automatically.

### 4. See Updates Instantly

Your browser updates automatically via HMR. No manual refresh needed.

### 5. Fix Errors

If there's an error, fix it in your editor and save. The error overlay in the browser will clear.

### 6. Stop the Server

Press `Ctrl+C` in the terminal to stop the dev server.

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will try the next available port:

```
  ➜  Local:   http://localhost:5174/
```

Check the terminal output for the actual port number.

### Browser Not Auto-Refreshing

1. Check that the terminal shows `[HMR] connected` (should appear shortly after opening the browser)
2. Verify you're accessing the correct URL (`http://localhost:5173/`)
3. Clear your browser cache (Cmd+Shift+Delete or Ctrl+Shift+Delete)
4. Try a hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
5. Clear the Vite cache as described above

### Changes Don't Appear

1. Confirm the file was saved (check the editor for any unsaved indicators)
2. Check the terminal for any error messages
3. Look for the HMR message in the terminal (should show the file was updated)
4. Clear the Vite cache and restart the dev server

### WebSocket Connection Failed

If you see a warning about WebSocket connection:

1. Ensure you're on the correct URL (`http://localhost:5173/`, not `http://127.0.0.1:5173/`)
2. Check if a firewall or proxy is blocking WebSocket connections
3. Restart the dev server
4. Restart your browser

## Performance Tips

- **Keep the dev server running** — don't stop and restart it between changes
- **Use specific imports** — avoid importing entire modules if you only need one function
- **Organize your code** — smaller, focused files compile faster
- **Monitor terminal output** — watch for compilation times; if they're slow, look for issues in your code

## Summary

| Task | How |
|------|-----|
| Start dev | `npm run dev` |
| View app | Open `http://localhost:5173/` |
| See changes | Save a file; HMR updates the browser |
| Check errors | Look at terminal output and browser overlay |
| Clear cache | `rm -rf node_modules/.vite` |
| Stop server | Press `Ctrl+C` in terminal |

The Vite dev server is designed for a fast, smooth development experience. With HMR, you'll see changes instantly and keep your app state intact between edits.
