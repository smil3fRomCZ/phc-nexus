/**
 * Centralizované formátování datumů — DD.MM.YYYY
 */
export function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

/**
 * DD.MM.YYYY HH:mm
 */
export function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

/**
 * Konverze ISO datetime stringu na YYYY-MM-DD pro HTML date input.
 * Zpracuje jak "2026-03-15T00:00:00.000000Z" tak "2026-03-15".
 */
export function toDateInputValue(dateStr: string | null): string {
    if (!dateStr) return '';
    return dateStr.slice(0, 10);
}

/**
 * Měsíc a rok — pro kalendář (např. "březen 2026")
 */
export function formatMonthYear(date: Date): string {
    return date.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
}
