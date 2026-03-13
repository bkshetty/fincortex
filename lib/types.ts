export type RiskScore = "LOW" | "MEDIUM" | "HIGH";

export type FraudSignal = {
  label: string;
};

export type ComplianceAdvisor = {
  checks: string[];
  warnings: string[];
  recommendation: string;
};

export type VendorEmailDraft = {
  subject: string;
  body: string;
  generated_at: string;
};

export type InvoiceData = {
  id?: string;
  created_at?: string;
  vendor_name: string;
  vendor_gstin?: string;
  invoice_number: string;
  invoice_date: string;
  currency: string;
  currency_symbol?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  tax_type: string;
  effective_tax_rate: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  cess_amount?: number;
  cgst_rate?: number;
  sgst_rate?: number;
  igst_rate?: number;
  cess_rate?: number;
  mixed_tax_rates_detected?: boolean;
  tax_mismatch?: boolean;
  tax_mismatch_percent?: number;
  currency_inconsistency?: boolean;
  risk_score: RiskScore;
  compliance_advisor: ComplianceAdvisor;
  fraud_signals: FraudSignal[];
  draft_vendor_email?: VendorEmailDraft;
  image_hash?: string;
  payment_status?: "PENDING" | "PAID" | "BLOCKED";
  notification_sent?: boolean;
};

export type InvoiceQuestionResponse = {
  answer: string;
};

export type DashboardSummary = {
  total_invoices: number;
  total_processed_value: number;
  high_risk_invoices: number;
  total_tax_collected: number;
};
