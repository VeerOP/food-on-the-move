export const UPI_PAYEE_VPA = "vedaansh.shah-1@oksbi";
export const UPI_PAYEE_NAME = "Vedaansh Shah";

export type UpiApp = "any" | "gpay" | "phonepe" | "paytm" | "bhim";

const SCHEMES: Record<UpiApp, string> = {
  any: "upi://pay",
  gpay: "tez://upi/pay",
  phonepe: "phonepe://pay",
  paytm: "paytmmp://pay",
  bhim: "bhim://pay",
};

export function buildUpiUri(opts: {
  amount: number;
  transactionNote?: string;
  transactionRef?: string;
  app?: UpiApp;
}) {
  const params = new URLSearchParams({
    pa: UPI_PAYEE_VPA,
    pn: UPI_PAYEE_NAME,
    am: opts.amount.toFixed(2),
    cu: "INR",
  });
  if (opts.transactionNote) params.set("tn", opts.transactionNote);
  if (opts.transactionRef) params.set("tr", opts.transactionRef);
  const scheme = SCHEMES[opts.app ?? "any"];
  return `${scheme}?${params.toString()}`;
}
