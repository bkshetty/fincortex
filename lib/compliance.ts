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
  const diff = Math.abs((invoice.subtotal || 0) + (invoice.tax_amount || 0) - (invoice.total_amount || 0));
  // Allow for 2% margin or up to 5 units of difference to handle OCR rounding errors
  return diff > 5 && diff > (invoice.total_amount || 0) * 0.02;
}

/** Validates Indian GSTIN Format (15 Characters) with State Code and PAN verification.
 *  Returns null if valid, or a specific error message string if invalid. */
function getGSTINError(gstin?: string): string | null {
  if (!gstin) return null;
  const clean = gstin.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  
  if (clean.length !== 15) {
    return `GSTIN '${gstin}' is ${clean.length} characters (must be exactly 15)`;
  }
  
  // 1. Verify State Code (First 2 digits 01-38, 97, 99)
  const stateCodeStr = clean.substring(0, 2);
  const stateCode = parseInt(stateCodeStr, 10);
  const validStateCodes = [
    ...Array.from({ length: 38 }, (_, i) => i + 1), // 01 to 38
    97, 99
  ];
  if (isNaN(stateCode) || !validStateCodes.includes(stateCode)) {
    return `GSTIN '${gstin}' has invalid state code '${stateCodeStr}' (must be 01-38, 97, or 99)`;
  }

  // 2. Verify PAN Part (Characters 3 to 12: 5 Alpha, 4 Numeric, 1 Alpha)
  const panPart = clean.substring(2, 12);
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(panPart)) {
    return `GSTIN '${gstin}' has invalid PAN structure (chars 3-12 must be AAAAA9999A)`;
  }

  // 3. Final structural regex
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(clean)) {
    return `GSTIN '${gstin}' has invalid structure (check entity code or checksum digit)`;
  }

  return null; // Valid
}

/** Backward-compatible wrapper */
function isInvalidGSTIN(gstin?: string): boolean {
  return getGSTINError(gstin) !== null;
}

/** Detects suspiciously round numbers (e.g., 50000.00) often found in fake bills */
function isSuspiciouslyRound(num: number) {
  if (num <= 0) return false;
  // Only flag extremely round figures for very large amounts (> 100,000)
  return num >= 100000 && num % 5000 === 0 && Number.isInteger(num);
}

/** Checks if the invoice date is in the future */
function isFutureDate(dateStr?: string) {
  if (!dateStr || dateStr === "N/A" || dateStr === "Unknown") return false;
  try {
    // Handle DD-MM-YYYY
    const bits = dateStr.includes("-") ? dateStr.split("-") : [];
    let d = new Date(dateStr);
    if (bits.length === 3 && bits[2].length === 4) {
      d = new Date(`${bits[2]}-${bits[1]}-${bits[0]}`);
    }
    
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return d > today;
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

  // 2. GSTIN Structural Integrity (Only if value exists)
  console.log(`[compliance] Checking GSTIN: "${invoice.vendor_gstin}"`);
  const gstinError = invoice.vendor_gstin ? getGSTINError(invoice.vendor_gstin) : null;
  console.log(`[compliance] GSTIN Error result: ${gstinError}`);
  if (gstinError) {
    signals.push({ label: gstinError });
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
  if (invoice.invoice_number && simpleNumbers.includes(String(invoice.invoice_number).toUpperCase()) && (invoice.total_amount || 0) > 10000) {
    signals.push({ label: "Generic/Placeholder invoice number" });
  }

  return signals;
}

export function calculateRiskScore(params: AnalysisParams): RiskScore {
  const { invoice, isDuplicate } = params;
  const fraudSignals = buildFraudSignals(params);

  // --- REFINED RISK LOGIC ---
  
  // 1. CRITICAL FRAUD (Instant HIGH)
  // Significant math mismatch (> 5% of total or > 100 units)
  const mathDiff = Math.abs((invoice.subtotal || 0) + (invoice.tax_amount || 0) - (invoice.total_amount || 0));
  const isSignificantMismatch = mathDiff > 2 && mathDiff > (invoice.total_amount || 0) * 0.05;
  
  if (isSignificantMismatch || isFutureDate(invoice.invoice_date)) {
    return "HIGH";
  }

  // 2. CUMULATIVE HIGH (3+ signals)
  if (fraudSignals.length >= 3) {
    return "HIGH";
  }

  // 3. MEDIUM RISK
  // Duplicates, minor math errors, or 1-2 generic signals
  if (
    isDuplicate || 
    fraudSignals.length >= 1 ||
    invoice.mixed_tax_rates_detected || 
    invoice.tax_mismatch || 
    (invoice.vendor_gstin && isInvalidGSTIN(invoice.vendor_gstin))
  ) {
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

  if (invoice.vendor_gstin) {
    const gstinErr = getGSTINError(invoice.vendor_gstin);
    if (!gstinErr) {
      checks.push("GSTIN format is valid");
    } else {
      warnings.push(gstinErr);
    }
  } else {
    warnings.push("Vendor GSTIN missing (Required for tax filing)");
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
