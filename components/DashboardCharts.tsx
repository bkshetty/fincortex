"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatCurrency } from "@/lib/formatCurrency";
import { InvoiceData } from "@/lib/types";

type Props = {
  invoices: InvoiceData[];
};

const RISK_COLORS: Record<string, string> = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444"
};

function parseMonthKey(value: string) {
  if (!value) return "Unknown";
  const dateStr = value.split("-").reverse().join("-"); // handle DD-MM-YYYY or DD-MMM-YYYY
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    const rawDate = new Date(value);
    if (Number.isNaN(rawDate.getTime())) return "Unknown";
    return `${rawDate.toLocaleString("en-US", { month: "short" })} ${rawDate.getFullYear()}`;
  }
  return `${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()}`;
}

function sortMonthKey(value: string) {
  if (value === "Unknown") return Number.MAX_SAFE_INTEGER;
  const date = new Date(`01 ${value}`);
  return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
}

export default function DashboardCharts({ invoices }: Props) {
  const riskDistribution = [
    { name: "LOW", value: invoices.filter((invoice) => invoice.risk_score?.toUpperCase() === "LOW").length },
    { name: "MEDIUM", value: invoices.filter((invoice) => invoice.risk_score?.toUpperCase() === "MEDIUM").length },
    { name: "HIGH", value: invoices.filter((invoice) => invoice.risk_score?.toUpperCase() === "HIGH").length }
  ].filter(c => c.value > 0);

  const topVendors = Object.entries(
    invoices.reduce<Record<string, { count: number; value: number }>>((acc, invoice) => {
      const vendor = invoice.vendor_name || "Unknown Vendor";
      const current = acc[vendor] ?? { count: 0, value: 0 };
      current.count += 1;
      current.value += invoice.total_amount || 0;
      acc[vendor] = current;
      return acc;
    }, {})
  )
    .map(([vendor, data]) => ({ vendor, count: data.count, value: Number(data.value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value || a.vendor.localeCompare(b.vendor))
    .slice(0, 5);

  let runningTaxTotal = 0;
  const monthlyData = Object.entries(
    invoices.reduce<Record<string, { count: number; tax: number }>>((acc, invoice) => {
      const monthKey = parseMonthKey(invoice.invoice_date);
      const current = acc[monthKey] ?? { count: 0, tax: 0 };
      current.count += 1;
      current.tax += invoice.tax_amount || 0;
      acc[monthKey] = current;
      return acc;
    }, {})
  )
    .sort((a, b) => sortMonthKey(a[0]) - sortMonthKey(b[0]))
    .map(([month, value]) => {
      runningTaxTotal += value.tax;
      return {
        month,
        invoice_volume: value.count,
        tax_collected: Number(runningTaxTotal.toFixed(2))
      };
    });

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="h-80 rounded-[1.75rem] border border-white/60 bg-white/85 p-5 shadow-lg shadow-slate-900/5 backdrop-blur">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Risk Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={riskDistribution.length ? riskDistribution : [{name: "No Data", value: 1}]} dataKey="value" nameKey="name" outerRadius={94} label>
              {(riskDistribution.length ? riskDistribution : [{name: "No Data", value: 1}]).map((entry) => (
                <Cell key={entry.name} fill={RISK_COLORS[entry.name] || "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </article>

      <article className="h-80 rounded-[1.75rem] border border-white/60 bg-white/85 p-5 shadow-lg shadow-slate-900/5 backdrop-blur">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Top Vendors</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topVendors} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="vendor"
              angle={0}
              interval={0}
              height={40}
              tick={{ fontSize: 12 }}
              tickFormatter={(name: string) => (name.length > 12 ? `${name.substring(0, 12)}...` : name)}
            />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value: any, name: any) => [
              name === 'Total Spent' ? formatCurrency(Number(value || 0), "INR") : value, 
              name
            ]} />
            <Bar dataKey="value" name="Total Spent" fill="#0f172a" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </article>

      <article className="h-80 rounded-[1.75rem] border border-white/60 bg-white/85 p-5 shadow-lg shadow-slate-900/5 backdrop-blur">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Monthly Invoice Volume</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value) => [value, "Invoices"]} />
            <Line type="monotone" dataKey="invoice_volume" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </article>

      <article className="h-80 rounded-[1.75rem] border border-white/60 bg-white/85 p-5 shadow-lg shadow-slate-900/5 backdrop-blur">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Tax Collected Over Time</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value || 0), "INR")} />
            <Line type="monotone" dataKey="tax_collected" stroke="#9333ea" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </article>
    </section>
  );
}
