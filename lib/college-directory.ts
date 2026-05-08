import { readFile } from "node:fs/promises";
import path from "node:path";

export type CollegeDirectoryRow = {
  university_name: string;
  college_name: string;
  college_type: string;
  state_name: string;
  district_name: string;
};

export type CollegeSuggestion = {
  name: string;
  country: string;
  web_pages: string[];
  university_name: string;
  college_type: string;
  state_name: string;
  district_name: string;
};

let directoryPromise: Promise<CollegeDirectoryRow[]> | null = null;

function parseCsvLine(line: string) {
  const cells: string[] = [];
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

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

async function loadDirectory() {
  if (!directoryPromise) {
    directoryPromise = (async () => {
      const csvPath = path.join(process.cwd(), "data", "database.csv");
      const raw = await readFile(csvPath, "utf8");
      const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);

      const rows: CollegeDirectoryRow[] = [];
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

      return rows;
    })();
  }

  return directoryPromise;
}

function scoreRow(row: CollegeDirectoryRow, term: string) {
  const haystacks = [
    row.college_name.toLowerCase(),
    row.university_name.toLowerCase(),
    row.state_name.toLowerCase(),
    row.district_name.toLowerCase(),
    row.college_type.toLowerCase(),
  ];

  let score = 0;
  for (const haystack of haystacks) {
    if (haystack === term) score += 40;
    else if (haystack.startsWith(term)) score += 25;
    else if (haystack.includes(term)) score += 10;
  }

  return score;
}

export async function searchCollegeDirectory(query: string, limit = 8) {
  const term = query.trim().toLowerCase();
  if (!term) return [] as CollegeSuggestion[];

  const rows = await loadDirectory();
  const matches = rows
    .filter((row) => {
      const haystack = [
        row.college_name,
        row.university_name,
        row.college_type,
        row.state_name,
        row.district_name,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    })
    .sort((left, right) => scoreRow(right, term) - scoreRow(left, term));

  const seen = new Set<string>();
  const suggestions: CollegeSuggestion[] = [];

  for (const row of matches) {
    const key = `${row.college_name}|${row.university_name}|${row.state_name}|${row.district_name}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    suggestions.push({
      name: row.college_name,
      country: "India",
      web_pages: [],
      university_name: row.university_name,
      college_type: row.college_type,
      state_name: row.state_name,
      district_name: row.district_name,
    });

    if (suggestions.length >= limit) break;
  }

  return suggestions;
}
