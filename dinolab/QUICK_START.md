# Quick Start Guide

Welcome to DinoLab! This guide will get you up and running in about 10 minutes. We'll walk through every step with copy-paste commands and show you what to expect.

## What You'll Need

Before we start, make sure you have:
- A terminal/command prompt
- Git installed (to clone the repo)
- About 10–15 minutes

If you don't have Git, Node.js, or Python yet, don't worry — we'll install those in steps 2 and 3.

---

## Step 1: Clone the Repository

First, let's get the code on your computer.

**Copy and paste this command:**

```bash
git clone https://github.com/your-org/dinolab.git
cd dinolab
```

**Expected output:**

```
Cloning into 'dinolab'...
remote: Counting objects: ...
remote: Compressing objects: ...
Receiving objects: 100% ...
Resolving deltas: 100% ...
```

You should now be inside the `dinolab` folder. You can verify this by running:

```bash
pwd
```

You should see a path ending in `/dinolab`.

---

## Step 2: Install Node.js

The web development server runs on Node.js. Let's check if you have it installed.

**Run this command:**

```bash
node --version
```

### If you see a version number (e.g., `v18.0.0` or higher)

Great! You're all set. Skip to **Step 3**.

### If you get "command not found"

You need to install Node.js. We recommend using a version manager:

**On macOS or Linux, use Homebrew:**

```bash
brew install node
```

**On Windows, download the installer:**

1. Go to https://nodejs.org/ (download the LTS version)
2. Run the installer and follow the prompts
3. Restart your terminal
4. Verify the install:

```bash
node --version
```

You should see `v18.0.0` or newer.

---

## Step 3: Install Python (Optional, for Local Infrastructure)

If you plan to work on backend services or local infrastructure, you'll need Python. If you only need the web frontend, you can skip this step.

**Check if Python is installed:**

```bash
python --version
```

or on some systems:

```bash
python3 --version
```

### If you see a version number (e.g., `Python 3.10.0` or higher)

You're all set. Skip to **Step 4**.

### If you get "command not found"

**On macOS or Linux, use Homebrew:**

```bash
brew install python
```

**On Windows:**

1. Go to https://www.python.org/downloads/ and download Python 3.10 or newer
2. Run the installer
3. **Important:** Check the box "Add Python to PATH"
4. Restart your terminal
5. Verify:

```bash
python --version
```

---

## Step 4: Install Web Dependencies

Now let's install the JavaScript packages the web frontend needs.

**Navigate to the web folder and install dependencies:**

```bash
cd web
npm install
```

**Expected output:**

You'll see a lot of text as npm downloads and installs packages. At the end, you should see something like:

```
added 1234 packages in 45s
```

The exact numbers will vary, but the key is that it completes without errors. If you see red text that says "ERR!", something went wrong — reach out to the team.

---

## Step 5: Start the Development Server

Now for the fun part! Let's fire up the local web server.

**Make sure you're still in the `web` folder, then run:**

```bash
npm run dev
```

**Expected output:**

```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

The important line is `Local: http://localhost:5173/` — that's your local development URL.

**Leave this terminal running.** The dev server stays active and automatically reloads when you make code changes.

---

## Step 6: Open the App in Your Browser

**Open a new terminal tab or window** (don't close the dev server terminal).

**Copy and paste this command to open your browser:**

```bash
# On macOS
open http://localhost:5173/

# On Linux
xdg-open http://localhost:5173/

# On Windows
start http://localhost:5173/
```

Or simply click this link: **http://localhost:5173/**

**Expected output:**

Your browser should open and show the DinoLab app. You should see the home page or dashboard.

---

## Step 7: Make Your First Change (Optional, but Recommended)

Let's verify that the live reload works.

1. Open a code editor (VS Code, Sublime, etc.) and navigate to the `dinolab/web` folder
2. Find a `.jsx` or `.js` file in the `src` folder
3. Make a small change — for example, change some text
4. Save the file
5. Watch your browser — it should automatically refresh and show your change!

This is the power of the dev server: you edit, save, and see changes instantly.

---

## Step 8: Watch the Build (Optional)

If you want to understand how the build system works or watch the build process in real time, check out:

**[How to Watch Build](./HOW_TO_WATCH_BUILD.md)**

That guide explains:
- How the Vite build system works
- How to watch build output
- How to debug build issues
- How to run production builds locally

---

## Troubleshooting

### "Port 5173 is already in use"

Another process is using that port. Either:
- Close other dev servers
- Or run on a different port:

```bash
npm run dev -- --port 5174
```

### "npm: command not found"

Node.js didn't install correctly. Try:

```bash
node --version
```

If that works but `npm` doesn't, reinstall Node.js.

### "Module not found" or other errors during `npm install`

Try clearing the npm cache and reinstalling:

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Still stuck?

Reach out to the team on Slack or open an issue on GitHub. Include:
- The exact error message
- Your operating system and Node.js version (run `node --version`)
- The steps you followed

---

## What's Next?

Once you're up and running:

1. **Read the project README** to understand the architecture
2. **Check out [How to Watch Build](./HOW_TO_WATCH_BUILD.md)** to learn about the build system
3. **Look at the code structure** in `web/src/` to see how components are organized
4. **Pick a small task** from the issue tracker and start contributing!

---

## Quick Reference

Here are the commands you'll use most often:

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the local dev server (in `web/` folder) |
| `npm run build` | Build for production |
| `npm run lint` | Check code style |
| `npm run test` | Run tests |

---

## You're All Set! 🎉

You now have a working development environment. Start the dev server with `npm run dev`, open http://localhost:5173/ in your browser, and you're ready to code.

Happy building!
