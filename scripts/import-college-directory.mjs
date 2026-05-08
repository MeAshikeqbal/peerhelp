import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

try {
  const envContent = await fs.readFile(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=");
    if (key && value) {
      process.env[key] = value;
    }
  }
} catch {
  console.warn("Could not load .env.local");
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing required environment variables:");
    console.error(
      `  SUPABASE_URL: ${supabaseUrl ? "✓" : "✗"} (or NEXT_PUBLIC_SUPABASE_URL)`,
    );
    console.error(`  SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? "✓" : "✗"}`);
    console.error("");
    console.error("To get SUPABASE_SERVICE_ROLE_KEY:");
    console.error("  1. Go to https://app.supabase.com/project/_/settings/api");
    console.error("  2. Scroll down to 'Project API keys'");
    console.error("  3. Copy the 'service_role' key (⚠️  Secret - never share this)");
    console.error("  4. Add to .env.local:");
    console.error("     SUPABASE_SERVICE_ROLE_KEY=your_key_here");
    process.exit(1);
  }

  const csvPath = path.join(process.cwd(), "data", "database.csv");
  const raw = await fs.readFile(csvPath, "utf8");
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);

  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    if (cells.length < 6) continue;

    rows.push({
      university_name: cells[1] || "",
      college_name: cells[2] || "",
      college_type: cells[3] || "",
      state_name: cells[4] || "",
      district_name: cells[5] || "",
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const batchSize = 500;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const { error } = await supabase.from("college_directory").upsert(batch, {
      onConflict: "university_name,college_name,state_name,district_name",
    });

    if (error) {
      throw error;
    }

    console.log(`Imported ${Math.min(index + batchSize, rows.length)} / ${rows.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
