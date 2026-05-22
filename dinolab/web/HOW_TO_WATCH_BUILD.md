# How to Watch the Build 👀

Welcome! This guide will help you understand what's happening when you run the Vite dev server. Think of it as a tour through the build process—we'll walk through what you'll see, what it means, and how to troubleshoot when things go sideways.

## Getting Started

When you run:

```bash
npm run dev
```

You're starting the Vite development server. Let's see what happens!

---

## What to Expect: The Startup Journey

### Stage 1: Server Starting (First 2-3 seconds)

You'll see something like this:

```
  VITE v5.0.0  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

**What this means:** Vite has fired up! Your dev server is now running and listening on `http://localhost:5173/`. The number (1234 ms) tells you how fast it started—usually 1-3 seconds is normal.

### Stage 2: Initial Module Loading (2-5 seconds after startup)

Once you open the browser, you'll see rapid output like:

```
✓ 42 modules transformed.

  GET / 200 2.34ms
  GET /src/main.tsx 200 1.12ms
  GET /src/App.tsx 200 0.98ms
  GET /src/components/Header.tsx 200 1.05ms
```

**What this means:** Vite is loading and transforming your source files on-the-fly. Each file is being processed and served to the browser. The response times (2.34ms, etc.) show how fast Vite is handling requests. This is the beauty of Vite—it only processes what you need, when you need it.

### Stage 3: Ready to Edit

Once you see:

```
✓ 42 modules transformed.
Ready!
```

**You're good to go!** The app is running in your browser. Now comes the fun part—edit a file and watch the magic happen.

---

## Live Editing: Watching the HMR Dance

Edit a component file (like `src/components/Header.tsx`) and save it. You'll see:

```
✓ 1 module transformed.

GET /src/components/Header.tsx?t=1699564321234 200 0.45ms
[vite] hot file change detected for /src/components/Header.tsx. Triggering full reload.
```

**What's happening:**
- The file was detected as changed
- Vite transformed it (1 module)
- The browser was notified via Hot Module Replacement (HMR)
- Your app reloaded with the new code—no full page refresh needed!

If it's a small change to CSS or a component, you might not even see a flicker in the browser. That's HMR working perfectly.

---

## Understanding Build Warnings

Sometimes you'll see yellow text like this:

```
⚠️  [plugin:vite:import-analysis] Failed to resolve import "./utils/helpers"
  /Users/you/dinolab/web/src/components/Button.tsx:3:8
  3  │ import { formatDate } from "./utils/helpers"
     │          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
This file does not exist.
```

**What this means:** You're importing something that doesn't exist. Check:
1. Is the file path correct? (Did you mean `./utils/helper.ts`?)
2. Does the file actually exist in that location?
3. Is the export name correct in the source file?

**Fix it:** Correct the import path and save. Vite will re-run the check automatically.

### Common Warnings

**"Module not found"**
```
⚠️  [plugin:vite:import-analysis] Failed to resolve import "react-router"
```
You're importing a package that isn't installed. Run `npm install react-router` to fix it.

**"Circular dependency"**
```
⚠️  Circular dependency detected:
  /src/utils/a.ts → /src/utils/b.ts → /src/utils/a.ts
```
Two files are importing each other. Restructure your code to break the cycle (often by moving shared logic to a third file).

---

## Understanding Build Errors

Errors appear in red and will prevent your app from loading:

```
✗ [ERROR] Expected "}" but found "{"

  /Users/you/dinolab/web/src/App.tsx:45:10:
  45  │   return (
  46  │     <div className="app">
  47  │       <Header
  48  │         title={title
     │                ^
  Missing closing parenthesis?
```

**What this means:** You have a syntax error. The file won't compile until you fix it.

**Fix it:** Look at the line number and the error message. In this case, line 48 is missing a closing `)`. Once you fix it and save, Vite will recompile automatically.

### Common Errors

**TypeScript Type Errors**
```
✗ [ERROR] Type 'string' is not assignable to type 'number'

  /src/components/Counter.tsx:12:5:
  12 │   const count: number = "5";
     │                          ^^^
```
You're assigning the wrong type. Change `"5"` to `5` (remove the quotes).

**JSX Syntax Errors**
```
✗ [ERROR] Unexpected token "<"

  /src/App.tsx:20:15:
  20 │   return (
  21 │     <div>
```
You might be missing `import React from 'react'` at the top (depending on your setup) or have malformed JSX.

---

## Troubleshooting Common Issues

### Issue 1: "command not found: npm"

**Problem:** You're trying to run `npm run dev` but npm isn't installed.

**Solution:**
1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Verify installation:
   ```bash
   node --version
   npm --version
   ```
3. Try again:
   ```bash
   npm run dev
   ```

### Issue 2: "Cannot find module 'vite'"

**Problem:** Your `node_modules` folder is missing or corrupted.

**Solution:**
1. Delete the `node_modules` folder:
   ```bash
   rm -rf node_modules
   ```
2. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
3. Reinstall dependencies:
   ```bash
   npm install
   ```
4. Try again:
   ```bash
   npm run dev
   ```

### Issue 3: "Port 5173 is already in use"

**Problem:** Another process is using the dev server port.

**Solution:**
1. Find and stop the other process:
   ```bash
   # On macOS/Linux:
   lsof -i :5173
   kill -9 <PID>
   
   # On Windows:
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```
2. Try again:
   ```bash
   npm run dev
   ```

Or just use a different port:
```bash
npm run dev -- --port 5174
```

### Issue 4: "Changes aren't showing up in the browser"

**Problem:** You edited a file but the browser didn't update.

**Solution:**
1. Check the terminal—are there any error messages in red?
2. Do a hard refresh in the browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
3. If still stuck, stop the dev server (`Ctrl+C`) and restart it:
   ```bash
   npm run dev
   ```

### Issue 5: "Strange behavior after installing a new package"

**Problem:** You ran `npm install` but things feel off.

**Solution:**
1. Stop the dev server (`Ctrl+C`)
2. Clear the Vite cache:
   ```bash
   rm -rf node_modules/.vite
   ```
3. Restart the dev server:
   ```bash
   npm run dev
   ```

---

## Reading the Build Output: A Cheat Sheet

| Symbol | Meaning |
|--------|----------|
| `✓` | Success! A module was transformed without issues. |
| `⚠️` | Warning. Something to be aware of, but it won't stop the build. |
| `✗` | Error. The build failed and needs fixing. |
| `→` | A dependency or import relationship. |
| `GET` | A file was requested by the browser. |
| `ms` | Milliseconds—how fast Vite processed something. |

---

## What's Happening Behind the Scenes

When you run `npm run dev`, here's the journey:

1. **Vite starts** → Reads your config, sets up the dev server
2. **Waits for requests** → Browser opens and asks for `/`
3. **Serves index.html** → Vite sends your HTML file
4. **Loads entry point** → Browser loads `src/main.tsx` (or your entry file)
5. **Transforms modules on-demand** → As the browser requests files, Vite transforms them from TypeScript/JSX to JavaScript
6. **Injects HMR client** → Vite adds a tiny script that listens for file changes
7. **Ready!** → Your app is running. Edit a file and HMR updates it instantly.

---

## Next Steps: The Adventure Continues! 🚀

Now that you understand the build process, here's where to go next:

### Option 1: Visualize Your Code (The Gource Movie)
Want to see your codebase evolve over time in a mesmerizing visualization? Check out **task-011: Gource Movie**. It's a beautiful way to watch your project grow!

**Next:** [Gource Movie Guide](../../../task-011/README.md)

### Option 2: Test in Your Browser
Open `http://localhost:5173/` in your browser and start poking around. Try:
1. Editing a component and watching it update live
2. Opening the browser's Developer Tools (`F12`)
3. Checking the Console tab for any warnings or errors
4. Exploring the Network tab to see what files Vite is serving

**Pro tip:** Keep the dev server running in one terminal window and your editor open in another. This is the sweet spot for development—edit, save, see results instantly.

### Option 3: Dive Deeper
If you want to understand Vite better:
- Check the official [Vite docs](https://vitejs.dev/)
- Explore your `vite.config.ts` file to see how the build is configured
- Look at `package.json` to see all available npm scripts

---

## You've Got This! 💪

The build process might seem mysterious at first, but now you know:
- What to expect when the server starts
- How to read the terminal output
- What warnings and errors mean
- How to fix common problems
- Where to go next

Feel free to come back to this guide whenever something in the terminal confuses you. Happy coding!
