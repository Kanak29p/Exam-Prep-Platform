export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

export function highlightText(text: string | undefined | null, search: string): JSX.Element {
  const safeText = text || "";
  const query = search.trim();
  if (!query) {
    return <span>{safeText}</span>;
  }

  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  const parts = safeText.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const uniqueKey = `highlight-${part}-${i}`;
        return regex.test(part) ? (
          <mark key={uniqueKey} className="bg-yellow-200 dark:bg-yellow-800/80 text-gray-900 dark:text-white rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        );
      })}
    </>
  );
}

export function buildPageList(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);
  if (left > 2) {
    pages.push("ellipsis");
  }
  for (let p = left; p <= right; p++) {
    pages.push(p);
  }
  if (right < totalPages - 1) {
    pages.push("ellipsis");
  }
  pages.push(totalPages);
  return pages;
}
