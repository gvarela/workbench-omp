import { readFileSync } from "node:fs";

export function formatToken(): string {
  return readFileSync("vendor/required-label.txt", "utf8").trim();
}
