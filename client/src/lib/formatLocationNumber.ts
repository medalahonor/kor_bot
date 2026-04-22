export function formatLocationNumber(dn: number): string {
  if (dn >= 200 && dn <= 299) return `${dn - 100}-Б`;
  if (dn >= 300 && dn <= 399) return `${dn - 200}-В`;
  if (dn === 999 || dn === 1001) return 'КС';
  if (dn >= 1201 && dn <= 1204) return 'ЭК';
  return String(dn);
}

/** Форматирует ссылку на локацию+строфу: "Лок.152-Б#5" или "КС#5" */
export function formatLocationRef(locationDn: number, verseDn?: number | null): string {
  const formatted = formatLocationNumber(locationDn);
  const isShortName = formatted === 'КС' || formatted === 'ЭК';
  const prefix = isShortName ? formatted : `Лок.${formatted}`;
  if (verseDn != null) return `${prefix}#${verseDn}`;
  return prefix;
}

export function matchesLocationSearch(dn: number, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return String(dn).includes(q) || formatLocationNumber(dn).toLowerCase().includes(q);
}

/** Форматирует путь заметки как цепочку: "101 → #0 → #3 / 200 → #1" */
export function formatNotePath(path: ReadonlyArray<{ locationDn: number; verseDn: number }>): string {
  let out = '';
  for (let i = 0; i < path.length; i++) {
    const step = path[i];
    if (i === 0) {
      out += formatLocationNumber(step.locationDn);
    } else if (step.locationDn !== path[i - 1].locationDn) {
      out += ` / ${formatLocationNumber(step.locationDn)}`;
    }
    out += ` → #${step.verseDn}`;
  }
  return out;
}
