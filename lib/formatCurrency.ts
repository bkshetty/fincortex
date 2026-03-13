export function formatCurrency(amount: number, currency: string) {
  const symbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    OMR: "OMR",
    AED: "AED"
  };

  const symbol = symbols[currency] || currency;
  return `${symbol} ${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatCurrencyTotals(items: Array<{ amount: number; currency: string }>) {
  const totals = items.reduce<Record<string, number>>((acc, item) => {
    const currency = item.currency || "INR";
    acc[currency] = (acc[currency] ?? 0) + Number(item.amount || 0);
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([currency, amount]) => formatCurrency(amount, currency))
    .join(" + ");
}
