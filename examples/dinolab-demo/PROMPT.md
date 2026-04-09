# DINOLAB-style demo specification (non-technical)

Use this file so you do not paste a huge string into the shell:

```bash
cd /path/to/OnePromptAI
source .venv/bin/activate
python main.py --dashboard --spec examples/dinolab-demo/PROMPT.md "Build the project"
```

Ensure `.env` has `GIT_REPO_URL`, `GIT_TOKEN`, and your LLM provider settings. `TARGET_REPO_PATH` should point at your local clone (e.g. `./target-repo`).

---

I want a **website** that feels like a **futuristic museum lab** about **dinosaur bones**, for **college-age learners** who aren’t specialists.

**Picking a dinosaur:** A **list of species** to choose from, each with **short facts**: what **family** it belongs to, **when** it lived, and **where** it’s from.

**Looking at the body:** **Four switchable “views”**: **bones only**, **muscles sketched on**, a **soft body outline**, and something that looks like an **X-ray**. One style at a time so it’s easy to learn.

**Tapping a bone:** **Click a bone** → **side panel** in a **wireframe / hologram** style: **plain-language** what the bone does, plus a **more science-style** bit about how researchers study it.

**Asking a hard question:** A **“lab research”** area for **serious science questions** about the dinosaur I’m viewing.

- On the **public internet**, if the **expert answering hookup** isn’t there yet: **no scary errors**—a **friendly “coming soon”** screen with **our branding**, maybe a **small mascot picture**, and calm wording.
- When that hookup **is** there: send the question and show a **careful, scientific** written answer.

**Look:** **Retro sci-fi**, **hologram**, **pixel-style corners**, **glow**—one cohesive style.

**Where files live:** Main site under **`dinolab/web`**. Optional **cloud piece** for the expert answers under something like **`dinolab/infra`** with **plain-English setup** (including trying it on a laptop first if possible).

**Quality:** An **automatic check** so changes don’t break the build; a **README** that says what to install first so nobody hits silly “missing pieces” errors.

**History movie:** A **small script** to play a **Gource-style movie** of **how the code changed over time** in the **git folder** for this project, with **safe timing settings** (nothing that breaks the movie tool).

**Going live later:** Explain that on common **“put my site on the internet”** services, only **`dinolab/web`** is the **public website** part.

**How the run should feel for the person testing (very important):**

- When they **start the build** with the **recommended command**, the **colorful live progress screen in the terminal** should **appear right away** so they **see activity from the first moment**, not a long silent wait. Put these steps in **simple copy-paste instructions** for the team (call it something like **“how to watch the build”**).
- **After the build finishes**, the instructions should say to run the **history movie** next so they can **see the story of the work**.
- For **testing and practice runs**, **do not** automatically **put the site on the internet** or treat it as **finished live deployment**. When the local steps are done, **end with a clear, friendly question** to the person: **“Do you want to publish the website live now?”**—and only **then** give the **separate optional steps** for going live. Until they say yes, **only** give them the **local link** (the one on their own computer) to **try the site in the browser**.

Treat this as a **brand-new product**; don’t say we’re copying another app.
