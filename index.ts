#!/usr/bin/env bun
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
const dogeDir = join(homedir(), ".doge");
const settingsPath = join(dogeDir, "settings.json");

function getModelNames(): string[] {
  if (!existsSync(dogeDir)) return [];
  return readdirSync(dogeDir)
    .filter((f) => f.startsWith("settings.json."))
    .map((f) => f.slice("settings.json.".length))
    .sort();
}

function getCurrentModel(models: string[]): string | null {
  if (!existsSync(settingsPath)) return null;
  const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  const currentEnv = JSON.stringify(settings?.env ?? null);
  for (const name of models) {
    const candidate = JSON.parse(readFileSync(join(dogeDir, `settings.json.${name}`), "utf-8"));
    if (currentEnv === JSON.stringify(candidate?.env ?? null)) return name;
  }
  return null;
}

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
};

function switchModel(name: string) {
  const src = join(dogeDir, `settings.json.${name}`);
  if (!existsSync(src)) {
    console.error(`${c.yellow}Error:${c.reset} Model "${name}" not found: ${src}`);
    process.exit(1);
  }
  const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, "utf-8")) : {};
  const model = JSON.parse(readFileSync(src, "utf-8"));
  settings.env = model.env;
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  console.log(`\n${c.green}${c.bold}Switched to ${c.cyan}${name}${c.reset}`);
  console.log(`${c.gray}Config: ${settingsPath}${c.reset}\n`);
}

async function interactiveSelect(models: string[], current: string | null): Promise<string> {
  let selected = 0;

  const render = () => {
    process.stdout.write("\x1b[?25l"); // hide cursor
    // header
    process.stdout.write("\x1b[2K");
    console.log(`${c.bold}Select a model:${c.reset}`);
    // list
    for (let i = 0; i < models.length; i++) {
      process.stdout.write("\x1b[2K");
      const hint = models[i] === current ? `  ${c.green}(current)${c.reset}` : "";
      if (i === selected) {
        console.log(`${c.cyan}${c.bold} > ${models[i]}${c.reset}${hint}`);
      } else {
        console.log(`${c.gray}   ${models[i]}${c.reset}${hint}`);
      }
    }
    process.stdout.write(`\x1b[${models.length + 1}A`); // move cursor up to header
  };

  const stdin = process.stdin;
  if (typeof stdin.setRawMode !== "function") {
    console.error("Interactive mode requires a terminal (TTY).");
    process.exit(1);
  }

  return new Promise((resolve) => {
    stdin.setRawMode(true);
    stdin.resume();
    render();

    stdin.on("data", (buf: Buffer) => {
      const key = buf.toString();
      if (key === "\x1b[A") {
        selected = (selected - 1 + models.length) % models.length;
      } else if (key === "\x1b[B") {
        selected = (selected + 1) % models.length;
      } else if (key === "\r" || key === "\n") {
        // clear rendered lines (header + list)
        for (let i = 0; i < models.length + 1; i++) {
          process.stdout.write("\x1b[2K\n");
        }
        process.stdout.write(`\x1b[${models.length + 1}A`);
        process.stdout.write("\x1b[?25h"); // show cursor
        stdin.setRawMode(false);
        stdin.pause();
        resolve(models[selected]);
      } else if (key === "\x03") {
        // ctrl+c
        process.stdout.write("\x1b[?25h");
        process.exit(0);
      }
      render();
    });
  });
}

const arg = process.argv[2];

if (arg) {
  switchModel(arg);
} else {
  const models = getModelNames();
  if (models.length === 0) {
    console.log(`${c.yellow}No models found${c.reset} in ${c.gray}~/.doge/settings.json.*${c.reset}`);
    console.log(`${c.dim}Create model configs like: ~/.doge/settings.json.deepseek${c.reset}`);
    process.exit(0);
  }
  const current = getCurrentModel(models);
  console.log(`${c.gray}Use arrow keys to navigate, enter to select, ctrl+c to cancel${c.reset}\n`);
  const chosen = await interactiveSelect(models, current);
  switchModel(chosen);
}
