#!/usr/bin/env node
/* Fail fast with a clear message if dependencies were not installed. */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const reactPkg = path.join(root, "node_modules", "react", "package.json");
if (!fs.existsSync(reactPkg)) {
  console.error(
    "\n  DINOLAB web: dependencies missing. From this folder run:\n\n    npm install\n\n  Then retry npm run lint / npm run build.\n",
  );
  process.exit(1);
}
