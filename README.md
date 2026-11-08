# Suro Bharati Sangeet Kala Kendra — Diploma Examination Billing Software

A specialized enterprise billing and examination fee management software engineered for **Suro Bharati Sangeet Kala Kendra** (*19/I, Vivekananda Lane, Serampore, Hooghly - 712201*).

---

## 📖 Project Overview

This application automates and standardizes the diploma examination billing system across more than 12,000 affiliated music, dance, recitation, and fine arts centres throughout India.

It replaces error-prone manual Excel workbook calculations with an automated web application that:
- Instantly auto-fills centre details from short codes (e.g., `0001`, `1011`).
- Accurately computes fees based on five geographic zones and three artistic disciplines (*Indian Classical/Traditional, Western Music, and Yoga*).
- Applies institutional concession slabs, seasonal discounts, and registration fees according to official Kendra rules.
- Generates pixel-perfect official Excel workbooks (`.xlsx` and `.zip`) matching the Kendra's pre-printed template.
- Generates high-definition bill images and enables one-click sequential dispatch directly to WhatsApp with standardized captions (e.g., `C-1011`, `C-1011 (Indian)`).
- Provides role-based access control with distinct logins for **Office Admin** and **Helpline Staff**.

---

## 🛠️ Technology Stack & Libraries

### Frontend (Client)
- **React 18**: Modern component-based user interface.
- **Vite 5**: Fast frontend tooling, HMR, and production bundler.
- **Tailwind CSS v4**: Utility-first CSS framework for layout and responsive styling.
- **Lucide React**: Clean, consistent icon set for desks, locks, and badges.

### Backend (Server)
- **Node.js (v20+ LTS)**: High-performance asynchronous backend runtime.
- **Express.js**: REST API server handling billing endpoints, centre lookup, rate queries, and authentication.
- **better-sqlite3**: Ultra-fast, synchronous embedded SQLite3 database running with WAL (Write-Ahead Logging) mode.
- **CORS & Express JSON**: Handling cross-origin requests and high-payload image transfers.

### Export & Document Engine
- **Python 3**: Background worker executing calculation and workbook formatting.
- **openpyxl (>= 3.1.2)**: Reads and writes Excel workbooks while preserving formulas, fonts, and cell merges.
- **Pillow (PIL)**: Image processing, border trimming, and high-DPI scaling.
- **LibreOffice Headless (`libreoffice-calc`)**: Converts Excel sheets into vector PDFs in Linux cloud environments.
- **Poppler Utils (`pdftoppm`)**: Converts vector PDFs into ultra-high-resolution PNG images for WhatsApp dispatch.
- **Windows PowerShell COM (`Excel.Application`)**: Hardware-accelerated 250% High-DPI table snapshotting on local Windows machines.

### Containerization & Deployment
- **Docker**: Debian 12 (Bookworm) container bundling Node.js, Python 3, LibreOffice, and system fonts.
- **Render.com / Linux VM**: Cloud hosting delivering public HTTPS access with automated GitHub deployments.

---

## ⚙️ How It Works (End-to-End Workflow)

```
[User / Operator]
       │
       ▼
[Login Portal] ──► Authenticates Admin (admin147) or Helpline (help123)
       │
       ├─► (If Helpline) ──► Restricted to "Helpline Bill Desk" (Locked UI tabs)
       │
       └─► (If Admin) ──► Full Access to all Modules
             │
             ├── 1. Centre Search ──► Type Short Code (e.g. "1011") ──► SQLite Centre DB fills Name, Address, Phone, Zone
             ├── 2. Discipline Entry ──► Select Single (Indian/Western/Yoga) or Joint Bill
             ├── 3. Candidate Count ──► Enter Old / New examinees per Diploma level (Adya to 8th / Churamoni)
             ├── 4. Automated Calculations:
             │        • Gross Fees = Sum(Exam Fees) + Sum(Convocation Fees)
             │        • Dynamic Concession = Slab % based on Candidate Count (0% to 45%)
             │        • Churamoni Exclusion Rule for Indian bills
             │        • Excel Decrease-Decimal Rounding (>= 0.5 rounds up, < 0.5 rounds down)
             │        • Registration Fees = ₹23 × Total New Examinees
             │        • Examiner Fees Deduction (optional custom notes & negative amount)
             │        • Net Payable Calculation
             │
             ├── 5. Excel Export ──► Injects data into Kendra template without breaking XML/media/headers
             │        • Single: ShortCode.xlsx
             │        • Joint:  ShortCode.zip (containing Indian, Western, Yoga workbooks)
             │
             └── 6. WhatsApp Sharing ──► Dual Mode (Web & Desktop App):
                      • Auto-copies rendered image to clipboard
                      • Formats standardized caption: C-XXXX or C-XXXX (Indian)
                      • Opens chat window with pre-filled caption; user presses Ctrl + V
```

---

## 🧩 Key Engineering Challenges & Solutions

### 1. Preserving Exact Excel Workbook Architecture & Formulas
- **Problem**: When `openpyxl` modified and saved the official Excel template (`template.xlsx`), Microsoft Excel displayed repair errors (*"Excel found unreadable content... Do you want to recover?"*). Furthermore, the Kendra logo header and computer-generated footer were stripped by standard openpyxl saves.
- **Solution**: We created a custom `sanitize_xlsx()` function. It operates on the raw `.xlsx` zip package, preserving `xl/media/image1.png`, restoring drawing relationships (`drawing1.xml.rels`), and re-injecting custom XML header/footer blocks (`<headerFooter>`) while removing legacy file link references. The result is a pristine workbook that opens without repair warnings.

### 2. Excel "Decrease Decimal" Rounding Rules
- **Problem**: Floating-point discount calculations produce decimals (e.g., `1205.5` or `1205.3`). In the official Excel ledger, fractional paise must match the Excel "Decrease Decimal" standard: values equal to or greater than `.5` round up (`1205.5` $\rightarrow$ `1206`), while values less than `.5` round down (`1205.4` $\rightarrow$ `1205`).
- **Solution**: Embedded explicit `=ROUND(..., 0)` formulas in the generated Excel cells and updated the JavaScript calculation engine with mathematical round-half-up logic (`Math.round()`), guaranteeing ledger consistency between the web view and exported files.

### 3. Churamoni Examination Percentage Exclusion Rule
- **Problem**: For Indian Classical bills, the highest diploma level (*All India Churamoni Examination*) must **never** be discounted. Concessions apply only to standard diploma levels:
  $$\text{Deduction} = (\text{Total Exam Fees} - \text{Churamoni Fees}) \times \text{Discount Percentage}$$
- **Solution**: The backend dynamically identifies the exact row of the Churamoni entry (Row 18) and outputs dynamic cell subtraction formulas:
  `=ROUND((E{total_row}-E{churamoni_row})*{pct_factor}, 0)`
  For non-Indian disciplines (Western, Yoga) or bills without Churamoni candidates, standard total factoring is used automatically.

### 4. Joint Bill Multi-Discipline Separation & Export
- **Problem**: Many affiliated academies teach multiple disciplines (e.g., Indian Vocal and Western Guitar). Single bills could not accommodate separate rate charts and examiner fees under one centre code.
- **Solution**: Built a multi-tab **Joint Bill Engine** allowing Indian Classical, Western Music, and Yoga to be entered under a single bill record. When exported, the system automatically creates three distinct formatted workbooks and packages them into a single clean ZIP archive named `[ShortCode].zip`.

### 5. Multi-Image Clipboard Limitation for WhatsApp Sharing
- **Problem**: When sharing joint bills, operating systems and browser clipboard APIs cannot copy two or three separate images to the clipboard simultaneously.
- **Solution**: Designed a sequential **One-by-One (1-by-1)** workflow:
  - **Step 1**: Copies Indian Part image to clipboard $\rightarrow$ opens chat with caption `C-XXXX (Indian)`.
  - **Step 2**: Copies Western Part image to clipboard $\rightarrow$ opens chat with caption `C-XXXX (Western)`.
  - **Step 3**: Copies Yoga Part image to clipboard $\rightarrow$ opens chat with caption `C-XXXX (Yoga)`.
  The UI visually highlights `👉 Next to Send` and tracks progress with `✓ Sent` badges.

### 6. Windows Excel COM vs. Linux Cloud Rendering
- **Problem**: On Windows, the app used `powershell.exe` with `Excel.Application` COM to snapshot tables into PNGs. When deployed to a Linux cloud container (Docker / Render), PowerShell and Microsoft Excel are not present.
- **Solution**: Implemented an automated cross-platform fallback in `export-excel.py`:
  - On Windows: Uses hardware-accelerated Excel COM at 250% zoom.
  - On Linux / Docker: Uses `soffice --headless --convert-to pdf` followed by `pdftoppm -png -r 200` to produce high-resolution bill PNGs on headless Linux servers.

### 7. Role-Based Access Control & Locked Helpline UI
- **Problem**: Helpline operators needed to view bills and dispatch them via WhatsApp, but should not have access to billing creation, rates, settings, or delete actions.
- **Solution**:
  - Implemented secure user authentication in SQLite (`users` table).
  - Configured two roles: **Admin** (`admin` / `admin147`) and **Helpline** (`helpline` / `help123`).
  - When logged in as Helpline, the user lands directly on the **Helpline Bill Desk**. All other tabs display a `🔒` lock icon, are unclickable, and trigger a helpful alert explaining access restrictions.

### 8. Docker Build & Debian 12 Environment
- **Problem**: Debian 11 ("bullseye") mirrors experienced 404 errors during apt-get package retrieval on cloud container builds, and older openpyxl packages lacked `CellRichText` support.
- **Solution**: Upgraded base image to `node:20-bookworm-slim` (Debian 12), utilized `openpyxl>=3.1.2`, set `DEBIAN_FRONTEND=noninteractive`, and added conditional fallbacks for rich-text headers.

---

## 📂 Project Directory Structure

```
diploma-billing/
├── Dockerfile                  # Container definition for Linux/Render deployment
├── package.json                # Node.js project manifest & dependencies
├── vite.config.js              # Vite client bundler configuration
├── server.js                   # Main Express application entry point
│
├── data/                       # Persistent data directory
│   ├── billing.db              # SQLite database (Centres, Rates, Bills, Users)
│   └── template.xlsx           # Official Kendra Excel template workbook
│
├── server/
│   ├── database.js             # SQLite initialization & schema definitions
│   ├── seed-rates.js           # Seeds 5-zone official rate charts & defaults
│   ├── render_excel_images.ps1 # Windows high-DPI Excel COM image renderer
│   │
│   └── routes/
│       ├── auth.js             # Authentication, login, & password management
│       ├── bills.js            # Bill creation, editing, query, & deletion
│       ├── centres.js          # Centre search & details API
│       ├── rates.js            # Rate chart query endpoints
│       ├── settings.js         # Global settings & concession slabs API
│       ├── export.js           # Excel download & WhatsApp image dispatcher
│       └── export-excel.py     # Python openpyxl engine & Linux headless renderer
│
└── src/                        # React Frontend Source Code
    ├── App.jsx                 # Top-level state, session guard, & routing
    ├── main.jsx                # React DOM entry point
    │
    └── components/
        ├── Login.jsx           # Branded login screen with quick role selector
        ├── Navbar.jsx          # Top navigation bar with locked tab indicators
        ├── BillingDesk.jsx     # Main billing workstation (Single & Joint)
        ├── BillHistory.jsx     # Ledger records, editing, export, & Helpline desk
        ├── CentresDirectory.jsx# Centre database browser & search
        ├── RateCharts.jsx      # 5-Zone rate chart viewer
        └── SettingsView.jsx    # Slabs, board details, & password updates
```

---

## 🚀 Local Installation & Running

### Prerequisites
- [Node.js (v20+ LTS)](https://nodejs.org)
- [Python (v3.10+)](https://python.org)
- [Git](https://git-scm.com)

### 1. Clone & Install
```bash
git clone https://github.com/cbdjsecure/diploma-billing.git
cd diploma-billing

# Install Node dependencies
npm install

# Install Python dependencies
pip install openpyxl pillow
```

### 2. Build & Run
```bash
# Build the React frontend
npm run build

# Start the server
node server.js
```
Open **`http://localhost:3001`** in your browser.

---

## 🌐 Default Login Credentials

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Office Admin** | `admin` | `admin147` | Full access to create bills, edit records, view rates, configure slabs, and manage accounts. |
| **Kendra Helpline** | `helpline` | `help123` | Helpline Bill Desk only: search bills, view details, and share via WhatsApp. Other tabs are locked (`🔒`). |

---

## 📄 License & Credits
Developed for **Suro Bharati Sangeet Kala Kendra**, Serampore, Hooghly. All rights reserved.
