// Bengali numerals helper
const BN = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBn(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "০";
  return String(n).replace(/\d/g, (d) => BN[Number(d)]);
}

export function fmtBdt(amount: number): string {
  return "৳" + toBn(Math.round(amount).toLocaleString("en-IN"));
}
