import fs from "fs";
import path from "path";

function walk(dir: string) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (/\.tsx?$/.test(file)) {
      let content = fs.readFileSync(full, "utf8");
      const next = content
        .replace(/, mode: "insensitive" as const/g, "")
        .replace(/, mode: "insensitive"/g, "")
        .replace(/\{ aliases: \{ has: search \} \},?\s*/g, "");
      if (next !== content) fs.writeFileSync(full, next);
    }
  }
}

walk("src");
