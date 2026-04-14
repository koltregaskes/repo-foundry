import { spawn } from "node:child_process";
import process from "node:process";

function run(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${scriptPath} failed with exit code ${code}`));
    });
  });
}

await run("./scripts/compile-public-data.mjs");
await run("./scripts/build-public.mjs");
await run("./scripts/build-internal.mjs");
