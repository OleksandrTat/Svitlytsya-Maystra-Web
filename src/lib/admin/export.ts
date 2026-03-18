export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string,
) {
  const header = columns.map((column) => column.label).join(",");

  const rows = data.map((row) =>
    columns
      .map((column) => {
        const rawValue = row[column.key];
        const stringValue = String(rawValue ?? "").replace(/"/g, '""');
        const shouldWrap =
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n");
        return shouldWrap ? `"${stringValue}"` : stringValue;
      })
      .join(","),
  );

  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
