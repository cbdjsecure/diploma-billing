import React from 'react';
import { BookOpen, CheckCircle, FileText, Send, Database, Calculator } from 'lucide-react';

export default function ReadmeView() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Software Documentation & How It Was Built
            </h2>
            <p className="text-sm text-slate-500">
              Architecture guide, calculation formulas, and operating instructions for Suro Bharati Sangeet Kala Kendra.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="prose prose-slate max-w-none text-sm space-y-6">
          <section>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-rose-600" /> 1. Examination Billing Logic & Formulas
            </h3>
            <p className="text-slate-600">
              The billing engine calculates candidate totals and applies tiered institutional concessions according to official rules:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Line Item Calculation:</strong> <code>Amount = Exam Fee × (Old Examinees + New Examinees)</code></li>
              <li><strong>Gross Fees:</strong> Sum of all level amounts (Adya through 8th / Churamoni / Grades / Semesters).</li>
              <li>
                <strong>Slab Concession (Auto-applied based on candidate count):</strong>
                <div className="my-2 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                  <div className="bg-slate-50 p-2 rounded border">0-14: 0%</div>
                  <div className="bg-slate-50 p-2 rounded border">15-35: 20%</div>
                  <div className="bg-slate-50 p-2 rounded border">36-99: 35%</div>
                  <div className="bg-slate-50 p-2 rounded border">100-250: 40%</div>
                  <div className="bg-slate-50 p-2 rounded border">251-400: 45%</div>
                </div>
              </li>
              <li><strong>Seasonal Concession:</strong> Additional percentage (e.g. 5%, 10%) added to the slab. Total Concession % = Slab % + Seasonal %.</li>
              <li><strong>Registration Fees:</strong> <code>Total New Examinees × ₹23</code> (subject-wise).</li>
              <li><strong>Form Fees:</strong> ₹30 per student is collected directly by the Principal and <strong>not billed</strong>.</li>
              <li><strong>Convocation Fees:</strong>
                <ul className="list-circle pl-5 mt-1 space-y-0.5">
                  <li><strong>West Bengal & NE States (Zone 1):</strong> Fully EXEMPTED (₹0).</li>
                  <li><strong>Kolkata Zone (Zone 4):</strong> ₹175 on 3rd, 5th, 7th, 8th years and Grades 3, 5, 7, 9.</li>
                  <li><strong>Central-East (Zone 3):</strong> ₹230 on Purna & 3rd; ₹350 on 5th, 7th, 8th.</li>
                  <li><strong>Other States (Zone 2):</strong> ₹460 on milestone years.</li>
                  <li><strong>Yoga:</strong> Universal chart with ₹0 convocation fee across all 8 semesters.</li>
                </ul>
              </li>
              <li><strong>Examiner Fees Deduction:</strong> Optional custom negative amount (e.g. <code>-₹2,500</code> for 2 schools) subtracted from final total.</li>
              <li>
                <strong>Final Formula:</strong><br />
                <code>Net Payable = (Gross Fees - Concessions) + Registration Fees + Convocation Fees - Examiner Deduction</code>
              </li>
            </ul>
          </section>

          <section className="border-t border-slate-100 pt-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" /> 2. Tech Stack & Architecture
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Backend:</strong> Node.js + Express.js API server running on port 3001.</li>
              <li><strong>Database:</strong> SQLite with <code>better-sqlite3</code>, storing over 12,000 centres from <code>dcentre backup</code>, rate charts across all zones, and saved bills.</li>
              <li><strong>Frontend:</strong> React 18 + Vite + Tailwind CSS for a modern, responsive, high-speed UI.</li>
              <li><strong>PDF Engine:</strong> Client-side <code>jsPDF</code> with <code>jspdf-autotable</code> for clean A4 bills matching your board layout.</li>
              <li><strong>Excel Export:</strong> Server-side <code>exceljs</code> creating official formatted <code>.xlsx</code> bills with customer columns (A-E) and internal audits (F).</li>
            </ul>
          </section>

          <section className="border-t border-slate-100 pt-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-green-600" /> 3. One-Click Dispatch Instructions
            </h3>
            <ol className="list-decimal pl-5 space-y-2 text-slate-600">
              <li>
                <strong>Creating a Bill:</strong> Enter the Short Code in the New Bill Desk search box. Centre name, Principal, Address, and Phone will auto-fill.
              </li>
              <li>
                <strong>Selecting Rates:</strong> Choose discipline (Indian, Western, or Yoga) and Zone (Zone 1 NE+WB, Zone 2 Other, Zone 3 Central-East, Zone 4 Kolkata).
              </li>
              <li>
                <strong>Entering Counts:</strong> Enter Old and New examinee counts. Watch the real-time discount slab and net payable recalculate.
              </li>
              <li>
                <strong>Save Record:</strong> Click <em>"Save Record"</em> to archive it in your ledger.
              </li>
              <li>
                <strong>Dispatch:</strong>
                <ul className="list-circle pl-5 mt-1 space-y-1">
                  <li>Click <em>"Download PDF"</em> for an official printable A4 document.</li>
                  <li>Click <em>"WhatsApp"</em> to open WhatsApp with a pre-filled itemized bill summary sent to the Principal's phone number.</li>
                  <li>In the <em>"Bill History"</em> tab, click the Excel icon to download the <code>.xlsx</code> sheet.</li>
                </ul>
              </li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

