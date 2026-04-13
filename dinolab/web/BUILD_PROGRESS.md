# Build Progress & Live Development with Vite

This guide explains how to use the Vite dev server during development, track build progress in real-time, and understand the current CI/CD integration status.

## Status Dashboard

### Completed Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Dev Server** | ✅ Complete | Vite dev server running on port 5173 with auto-reload |
| **Hot Module Replacement (HMR)** | ✅ Complete | Live updates without full page reload; state preserved |
| **Production Build** | ✅ Complete | `npm run build` generates optimized dist/ output |
| **Unit Tests** | ✅ Complete | Vitest configured; run with `npm run test` |
| **Smoke Tests** | ✅ Complete | smoke-test.sh validates dev server startup and build output |
| **CI Workflow** | ✅ Complete | GitHub Actions workflow configured; runs on push/PR |

### In Progress / Planned

- Enhanced test coverage reporting
- E2E test integration (Playwright/Cypress)
- Performance benchmarking in CI
- Automated lighthouse audits

### CI/CD Workflow Status

**GitHub Actions Workflow:** `.github/workflows/ci.yml`

The CI pipeline runs on every push and pull request:
1. **Install dependencies** — `npm ci`
2. **Run unit tests** — `npm run test` (Vitest)
3. **Run smoke tests** — `./smoke-test.sh` (validates dev server and build)
4. **Build for production** — `npm run build`
5. **Verify build output** — checks dist/ directory exists and contains expected files

**Current Status:** All workflows passing. See [Actions](../../actions) for latest run details.

---

## Smoke Test Verification

### What smoke-test.sh Does

The smoke test script (`./smoke-test.sh`) performs critical validation:

1. **Dev Server Startup** — Verifies Vite dev server starts and responds on http://localhost:5173
2. **Build Compilation** — Runs `npm run build` and confirms dist/ directory is created
3. **Output Validation** — Checks that essential files exist in dist/ (index.html, CSS, JS bundles)
4. **Error Detection** — Fails fast if any step encounters errors

### Running Smoke Tests Locally

```bash
cd dinolab/web
./smoke-test.sh
```

**Expected Output:**
```
✓ Dev server started successfully
✓ Build completed successfully
✓ dist/ directory contains expected files
✓ All smoke tests passed
```

### What's Verified & Tested

**Development Environment:**
- ✅ Vite dev server starts without errors
- ✅ HMR WebSocket connection established
- ✅ File watching and change detection working
- ✅ TypeScript compilation successful
- ✅ No console errors or warnings during startup

**Production Build:**
- ✅ Build completes without errors
- ✅ dist/ directory created with all necessary files
- ✅ index.html generated correctly
- ✅ CSS and JavaScript bundles created and minified
- ✅ Source maps generated (if configured)
- ✅ No build warnings or errors

**Testing:**
- ✅ Unit tests run with Vitest
- ✅ Test files located in `src/**/*.test.ts(x)`
- ✅ All tests pass before CI approval
- ✅ Coverage reports generated

---

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

### 5. Run Tests

```bash
npm run test
```

Tests run in watch mode during development. Fix any test failures before committing.

### 6. Fix Errors

If there's an error, fix it in your editor and save. The error overlay in the browser will clear.

### 7. Build for Production

When ready to deploy:

```bash
npm run build
```

This creates an optimized dist/ directory ready for deployment.

### 8. Stop the Server

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
- **Run tests regularly** — catch issues early in development

## Summary

| Task | How |
|------|-----|
| Start dev | `npm run dev` |
| View app | Open `http://localhost:5173/` |
| See changes | Save a file; HMR updates the browser |
| Check errors | Look at terminal output and browser overlay |
| Run tests | `npm run test` |
| Build for prod | `npm run build` |
| Run smoke tests | `./smoke-test.sh` |
| Clear cache | `rm -rf node_modules/.vite` |
| Stop server | Press `Ctrl+C` in terminal |

The Vite dev server is designed for a fast, smooth development experience. With HMR, you'll see changes instantly and keep your app state intact between edits. All features are verified through automated testing and CI/CD workflows.
