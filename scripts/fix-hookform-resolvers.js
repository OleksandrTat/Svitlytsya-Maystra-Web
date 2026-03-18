const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");

function copyIfMissing(from, to) {
  if (!fs.existsSync(from)) {
    return;
  }
  if (fs.existsSync(to)) {
    return;
  }
  fs.copyFileSync(from, to);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeJsonIfChanged(filePath, next) {
  const prevRaw = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const nextRaw = `${JSON.stringify(next, null, 2)}\n`;
  if (prevRaw === nextRaw) {
    return;
  }
  fs.writeFileSync(filePath, nextRaw);
}

function patchExportsImportIfMissing(packageRoot, exportKey, fallbackPath) {
  const packageJsonPath = path.join(packageRoot, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return;
  }

  const pkg = readJson(packageJsonPath);
  if (!pkg || !pkg.exports || !pkg.exports[exportKey]) {
    return;
  }

  const exportEntry = pkg.exports[exportKey];
  if (typeof exportEntry !== "object") {
    return;
  }

  let changed = false;

  if (exportEntry.import) {
    const importTarget = path.join(packageRoot, exportEntry.import);
    const fallbackTarget = path.join(packageRoot, fallbackPath);
    if (!fs.existsSync(importTarget) && fs.existsSync(fallbackTarget)) {
      exportEntry.import = fallbackPath;
      changed = true;
    }
  }

  if (exportEntry["react-server"]) {
    const reactServerTarget = path.join(packageRoot, exportEntry["react-server"]);
    const fallbackTarget = path.join(packageRoot, fallbackPath);
    if (!fs.existsSync(reactServerTarget) && fs.existsSync(fallbackTarget)) {
      exportEntry["react-server"] = fallbackPath;
      changed = true;
    }
  }

  if (pkg.module) {
    const moduleTarget = path.join(packageRoot, pkg.module);
    const fallbackTarget = path.join(packageRoot, fallbackPath);
    if (!fs.existsSync(moduleTarget) && fs.existsSync(fallbackTarget)) {
      pkg.module = fallbackPath;
      changed = true;
    }
  }

  if (changed) {
    pkg.exports[exportKey] = exportEntry;
    writeJsonIfChanged(packageJsonPath, pkg);
  }
}

function ensureSupabaseAuthGetUser(typesFilePath) {
  if (!fs.existsSync(typesFilePath)) {
    return;
  }

  const content = fs.readFileSync(typesFilePath, "utf8");
  const hasGetUser = content.includes("getUser(");
  const hasIndexSignature = content.includes("[key: string]: any;");

  const marker = "constructor(options: SupabaseAuthClientOptions);";
  if (!content.includes(marker)) {
    return;
  }

  let insert = marker;
  if (!hasIndexSignature) {
    insert += "\n  [key: string]: any;";
  }
  if (!hasGetUser) {
    insert +=
      "\n  getUser(jwt?: string): Promise<{ data: { user: AuthUser | null }; error: any | null }>;";
  }

  if (insert === marker) {
    return;
  }

  const updated = content.replace(marker, insert);

  fs.writeFileSync(typesFilePath, updated);
}

const resolversRoot = path.join(repoRoot, "node_modules", "@hookform", "resolvers");
if (fs.existsSync(resolversRoot)) {
  copyIfMissing(
    path.join(resolversRoot, "dist", "resolvers.module.js"),
    path.join(resolversRoot, "dist", "resolvers.mjs"),
  );

  copyIfMissing(
    path.join(resolversRoot, "zod", "dist", "zod.module.js"),
    path.join(resolversRoot, "zod", "dist", "zod.mjs"),
  );
}

const reactHookFormRoot = path.join(repoRoot, "node_modules", "react-hook-form");
if (fs.existsSync(reactHookFormRoot)) {
  patchExportsImportIfMissing(
    reactHookFormRoot,
    ".",
    "./dist/index.cjs.js",
  );
}

const framerMotionRoot = path.join(repoRoot, "node_modules", "framer-motion");
if (fs.existsSync(framerMotionRoot)) {
  patchExportsImportIfMissing(
    framerMotionRoot,
    ".",
    "./dist/cjs/index.js",
  );
  patchExportsImportIfMissing(
    framerMotionRoot,
    "./debug",
    "./dist/cjs/debug.js",
  );
  patchExportsImportIfMissing(
    framerMotionRoot,
    "./client",
    "./dist/cjs/client.js",
  );
  patchExportsImportIfMissing(
    framerMotionRoot,
    "./dom",
    "./dist/cjs/dom.js",
  );
  patchExportsImportIfMissing(
    framerMotionRoot,
    "./dom/mini",
    "./dist/cjs/dom-mini.js",
  );
  patchExportsImportIfMissing(
    framerMotionRoot,
    "./m",
    "./dist/cjs/m.js",
  );
  patchExportsImportIfMissing(
    framerMotionRoot,
    "./mini",
    "./dist/cjs/mini.js",
  );
}

const supabaseJsRoot = path.join(repoRoot, "node_modules", "@supabase", "supabase-js");
if (fs.existsSync(supabaseJsRoot)) {
  ensureSupabaseAuthGetUser(path.join(supabaseJsRoot, "dist", "index.d.mts"));
  ensureSupabaseAuthGetUser(path.join(supabaseJsRoot, "dist", "index.d.cts"));
}
