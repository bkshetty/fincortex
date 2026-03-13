import { ComplianceAdvisor, FraudSignal, InvoiceData, RiskScore } from "@/lib/types";

type AnalysisParams = {
  invoice: Omit<InvoiceData, "risk_score" | "compliance_advisor" | "fraud_signals">;
  isDuplicate: boolean;
};

// --- Helper Validation Functions ---

function formatPercent(value?: number) {
  return typeof value === "number" ? `${value.toFixed(2)}%` : "0.00%";
}

function hasTotalMismatch(invoice: AnalysisParams["invoice"]) {
  return Math.abs((invoice.subtotal || 0) + (invoice.tax_amount || 0) - (invoice.total_amount || 0)) > 1;
}

/** Validates Indian GSTIN Format (15 Characters) */
function isInvalidGSTIN(gstin?: string) {
  if (!gstin) return true;
  const clean = gstin.trim().toUpperCase();
  // Standard GSTIN: 2 digits + 10 alphanumeric (PAN) + 1 digit + 1 char + 1 digit
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return !gstRegex.test(clean);
}

/** Detects suspiciously round numbers (e.g., 50000.00) often found in fake bills */
function isSuspiciouslyRound(num: number) {
  if (num <= 0) return false;
  // If it's a large amount and ends in multiple zeros
  return num > 1000 && num % 100 === 0 && Number.isInteger(num);
}

/** Checks if the invoice date is in the future */
function isFutureDate(dateStr?: string) {
  if (!dateStr) return false;
  try {
    const invDate = new Date(dateStr);
    const today = new Date();
    return invDate > today;
  } catch {
    return false;
  }
}

// --- Main Logic ---

export function buildFraudSignals(params: AnalysisParams): FraudSignal[] {
  const { invoice, isDuplicate } = params;
  const signals: FraudSignal[] = [];

  // 1. Duplicate Check
  if (isDuplicate) {
    signals.push({ label: "Duplicate invoice detected" });
  }

  // 2. GSTIN Structural Integrity
  if (isInvalidGSTIN(invoice.vendor_gstin)) {
    signals.push({ label: "Invalid GSTIN format detected" });
  }

  // 3. Tax Rate Threshold
  if ((invoice.effective_tax_rate || 0) > 35) {
    signals.push({ label: "Unusually high tax rate (>35%)" });
  }

  // 4. Value Anomalies
  if ((invoice.total_amount || 0) > 1_000_000) {
    signals.push({ label: "High-value transaction alert" });
  }

  // 5. Math Consistency
  if (hasTotalMismatch(invoice)) {
    signals.push({ label: "Mathematical total inconsistency" });
  }

  // 6. Round Number Anomaly (Common in manual fake bills)
  if (isSuspiciouslyRound(invoice.total_amount) && isSuspiciouslyRound(invoice.subtotal)) {
    signals.push({ label: "Suspiciously round figures (Audit required)" });
  }

  // 7. Temporal Anomaly
  if (isFutureDate(invoice.invoice_date)) {
    signals.push({ label: "Post-dated invoice detected" });
  }

  // 8. Serial Pattern Check
  const simpleNumbers = ["1", "001", "INV-1", "INV-001", "TEST"];
  if (simpleNumbers.includes(invoice.invoice_number.toUpperCase()) && invoice.total_amount > 10000) {
    signals.push({ label: "Generic/Placeholder invoice number" });
  }

  return signals;
}

export function calculateRiskScore(params: AnalysisParams): RiskScore {
  const { invoice, isDuplicate } = params;
  const fraudSignals = buildFraudSignals(params);

  // Instant High Risk
  if (isDuplicate || hasTotalMismatch(invoice) || isFutureDate(invoice.invoice_date)) {
    return "HIGH";
  }

  // Cumulative Risk
  if (fraudSignals.length >= 2 || (invoice.tax_mismatch_percent && invoice.tax_mismatch_percent > 5)) {
    return "HIGH";
  }

  if (fraudSignals.length === 1 || invoice.mixed_tax_rates_detected || invoice.tax_mismatch || isInvalidGSTIN(invoice.vendor_gstin)) {
    return "MEDIUM";
  }

  return "LOW";
}

export function buildComplianceAdvisor(params: AnalysisParams): ComplianceAdvisor {
  const { invoice, isDuplicate } = params;
  const checks: string[] = [];
  const warnings: string[] = [];
  const fraudSignals = buildFraudSignals(params);

  // Vendor & GSTIN
  if (invoice.vendor_name.trim()) {
    checks.push("Vendor identity verified");
  } else {
    warnings.push("Vendor name missing");
  }

  if (!isInvalidGSTIN(invoice.vendor_gstin)) {
    checks.push("GSTIN format is valid");
  } else {
    warnings.push("Vendor GSTIN format is non-standard");
  }

  // Currency & Math
  if (!invoice.currency_inconsistency) {
    checks.push("Currency format is consistent");
  } else {
    warnings.push("Currency inconsistency detected");
  }

  if (!hasTotalMismatch(invoice)) {
    checks.push("Invoice math is verified (Subtotal + Tax = Total)");
  } else {
    warnings.push("Invoice math mismatch (Possible data tempering)");
  }

  // Dates
  if (!isFutureDate(invoice.invoice_date)) {
    checks.push("Invoice date is valid");
  } else {
    warnings.push("Future-dated invoice (Temporal fraud signal)");
  }

  // Map all other fraud signals to warnings
  fraudSignals.forEach(s => {
    if (!warnings.includes(s.label)) {
      warnings.push(s.label);
    }
  });

  const recommendation =
    warnings.length > 0
      ? "SYSTEM ALERT: Discrepancies found. Review fraud signals and AI-drafted vendor email before proceeding."
      : "CLEAN RECORD: Invoice verified against all compliance rules and is safe for processing.";

  return { checks, warnings, recommendation };
}
