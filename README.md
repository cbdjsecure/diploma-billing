# Suro Bharati Sangeet Kala Kendra — Diploma Exam Billing Software

A modern billing and examination fee management application built specifically for **Suro Bharati Sangeet Kala Kendra** (19/I, Vivekananda Lane, Serampore, Hooghly - 712201).

---

## 🎯 Key Capabilities

1. **Lightning-Fast Centre Autofill**:
   - Integrated with your `dcentre backup` database (>12,000 active centres).
   - Enter Short Code (e.g. `0009`, `1111`) or search by name — instantly fills Institute Name, Principal, Address, and Phone.
   - Auto-detects Kolkata Zone (Pin 700) and West Bengal state from address.

2. **Automated 5-Zone Rate Chart Engine**:
   - **Zone 1 (NE States + West Bengal, excl. Kolkata)**: Rates for Adya to 8th + Churamoni; Western Grades 1–9. **Convocation Fee is fully EXEMPTED (₹0)**.
   - **Zone 4 (Kolkata Zone, Pin 700)**: Adya to 8th + Churamoni; Western Grades 1–9. ₹175 convocation fee on qualifying diplomas.
   - **Zone 3 (Central-East: Bihar, Jharkhand, Odisha, Chhattisgarh)**: ₹230 / ₹350 convocation tiers.
   - **Zone 2 (Other States across India)**: ₹460 convocation tiers.
   - **Yoga Chart (Universal All-India)**: Semester 1 to 8 with ₹0 convocation fees.

3. **Dynamic Institutional Concessions & Slabs**:
   - Real-time automatic discount slab selection based on total examinees:
     - 0–14 candidates: **0%**
     - 15–35 candidates: **20%**
     - 36–99 candidates: **35%**
     - 100–250 candidates: **40%**
     - 251–400 candidates: **45%**
     - Fully customizable in the *Settings & Slabs* screen.
   - **Seasonal / Extra Concession**: Quick entry for management-declared discounts (+5%, +10%, etc.).

4. **Ancillary Fees & Deductions**:
   - **Registration Fees**: Automatically calculated as `₹23 × Total New Examinees`.
   - **Exam Form Fee**: ₹30 per student is taken directly by Principal (not billed).
   - **Examiner Fees Deduction**: Enter custom notes (e.g. *"Examiner fees for 2 school"*) and negative amounts (e.g. `-2500.00`). Auto-deducted from total payable.

5. **Multi-Channel Dispatch**:
   - 📄 **1-Click A4 PDF Generation**: Clean printable bill matching the official board design.
   - 📊 **Excel Export (.xlsx)**: Generates customer copy (Cols A–E) and internal notes (Col F).
   - 💬 **WhatsApp Dispatch**: Formats a WhatsApp message with all item totals and opens a direct chat with the Principal.

---

## 🏗️ Architecture & How It Was Built

```
diploma-billing/
├── data/                  # SQLite storage (billing.db)
├── server/
│   ├── database.js        # SQLite setup & schema definition
│   ├── seed-rates.js      # Populates 5-zone official rate tables & default settings
│   ├── import-centres.js  # Imports dcentre backup Excel workbook into DB
│   └── routes/
│       ├── centres.js     # Live search & lookup endpoints
│       ├── rates.js       # Dynamic rate chart query & edit API
│       ├── bills.js       # Save, retrieve, and delete bills ledger
│       ├── settings.js    # Session & discount slab manager
│       └── export.js      # Excel (.xlsx) generator using ExcelJS
├── src/
│   ├── components/
│   │   ├── Navbar.jsx           # Tab navigation
│   │   ├── BillingDesk.jsx      # Main rapid billing desk
│   │   ├── BillHistory.jsx      # Historical ledger & Excel export
│   │   ├── CentresDirectory.jsx # Search through >12,000 centres
│   │   ├── RateCharts.jsx       # In-app rate editor
│   │   ├── SettingsView.jsx     # Slab & session editor
│   │   └── ReadmeView.jsx       # Embedded user guide
│   ├── utils/
│   │   └── pdfGenerator.js      # Client-side A4 PDF engine
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── server.js              # Express API server (port 3001)
├── vite.config.js         # Vite frontend dev server (port 5173)
├── tailwind.config.js
└── package.json
```

---

## 🚀 Running the Software

### 1. Prerequisites
- **Node.js 18+** installed (portable Node.js v22.11 is included in `tools/`).

### 2. Start Both Backend & Frontend
Open PowerShell in the project directory:
```powershell
Set-Location "C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing"
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`

### 3. Production Build
```powershell
npm run build
npm start
```
The Express server will serve both the API and the compiled frontend on port 3001.

---

## 📊 Billing Formula Summary

$$\text{Net Payable} = (\text{Gross Exam Fees} - \text{Total Concession}) + \text{Registration Fees} + \text{Convocation Fees} - \text{Examiner Deduction}$$

Where:
- $\text{Total Concession \%} = \text{Slab \%} + \text{Seasonal \%}$
- $\text{Registration Fees} = \text{New Examinees} \times ₹23$
- $\text{Convocation Fees} = 0 \text{ for West Bengal and NE States}$

