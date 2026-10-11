export const FILTER_MONTHS = [
  { value: "all", label: "All Months" },
  { value: "01", label: "Jan (01)" },
  { value: "02", label: "Feb (02)" },
  { value: "03", label: "Mar (03)" },
  { value: "04", label: "Apr (04)" },
  { value: "05", label: "May (05)" },
  { value: "06", label: "Jun (06)" },
  { value: "07", label: "Jul (07)" },
  { value: "08", label: "Aug (08)" },
  { value: "09", label: "Sep (09)" },
  { value: "10", label: "Oct (10)" },
  { value: "11", label: "Nov (11)" },
  { value: "12", label: "Dec (12)" },
];

/**
 * Dynamically extract and sort unique years present in the dataset.
 * Guarantees current year is always available while strictly reflecting real data.
 */
export function getDynamicYears(
  items: Array<{ date?: string | null }> = [],
  extraYears: string[] = []
): Array<{ value: string; label: string }> {
  const currentYear = new Date().getFullYear().toString();
  const yearsSet = new Set<string>();

  // Add extra years provided (e.g. from server database query)
  extraYears.forEach((y) => {
    if (y && /^\d{4}$/.test(y)) yearsSet.add(y);
  });

  // Extract from item dates (format: YYYY-MM-DD or similar)
  items.forEach((item) => {
    if (item?.date) {
      const match = item.date.match(/^(\d{4})/);
      if (match && match[1]) {
        yearsSet.add(match[1]);
      }
    }
  });

  // Always ensure at least the current year is included
  yearsSet.add(currentYear);

  const sortedYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));

  return [
    { value: "all", label: "All Years" },
    ...sortedYears.map((year) => ({ value: year, label: year })),
  ];
}
