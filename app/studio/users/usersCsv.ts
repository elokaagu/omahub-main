import type { UserWithBrands } from "./types";

export function escapeCsvField(value: string): string {
  const s = String(value ?? "");
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildUsersCsv(rows: UserWithBrands[]): string {
  const headers = ["email", "role", "brands", "created_at", "user_id"];
  const lines = [
    headers.join(","),
    ...rows.map((u) =>
      [
        escapeCsvField(u.email),
        escapeCsvField(u.role),
        escapeCsvField(u.brand_names.join("; ")),
        escapeCsvField(u.created_at),
        escapeCsvField(u.id),
      ].join(","),
    ),
  ];
  return lines.join("\r\n");
}

export function usersCsvFilename(
  roleFilter: string,
  searchTerm: string,
  date = new Date(),
): string {
  const roleSlug =
    roleFilter === "all" ? "all-roles" : roleFilter.replace(/_/g, "-");
  const searchSlug = searchTerm
    ? `-search-${searchTerm.slice(0, 40).replace(/[^\w-]+/g, "-")}`
    : "";
  return `omahub-users-${roleSlug}${searchSlug}-${date.toISOString().slice(0, 10)}.csv`;
}

export function triggerCsvDownload(filename: string, csvContent: string) {
  const blob = new Blob([`﻿${csvContent}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
