import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL || "";
const isPostgres = /^postgres(ql)?:\/\//i.test(url);

if (!isPostgres) {
  console.log(
    "[db] Skipping prisma db push (DATABASE_URL is not postgres)."
  );
  process.exit(0);
}

console.log("[db] Running prisma db push...");
execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });

