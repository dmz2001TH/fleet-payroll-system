# HANDOFF.md — NPC Fleet Payroll System

> **This document is the single source of truth for any agent continuing this project.**
> Read this entirely before writing any code.

---

## 🧭 Project Overview

**Name:** NPC Fleet Payroll System
**Client:** NPC Logistics — บริษัทขนส่ง จัดการคนขับรถ (drivers) ~30 unit
**Owner:** dmz2001TH (GitHub)
**Repo:** https://github.com/dmz2001TH/fleet-payroll-system

### What This System Does

แทนที่ workflow manual ที่ต้องทำทุก cut-off period (ทุก 10 วัน):

1. **กรอกเที่ยววิ่ง** ลง Excel → แทนด้วย Web Portal
2. **นับ/คำนวณรายได้** แต่ละ driver ตาม price tier → auto-calculate
3. **ส่ง payslip** ให้ driver แต่ละคนผ่าน LINE → auto-send
4. **Export** ข้อมูลไป Google Sheets → auto-sync

### How to Run

```powershell
# Backend
cd fleet-payroll-system
cp .env.example .env
npm install
npm start                    # runs on port 3000

# Frontend (first time)
cd web
npm install
npm run build                # outputs to web/dist/
cd ..
npm start                    # serves both API + frontend

# Dev mode (frontend hot reload)
# Terminal 1: npm start (backend on :3000)
# Terminal 2: cd web && npm run dev (frontend on :5173, proxies /api to :3000)
```

---

## 📊 Excel Structure (Source of Truth สำหรับ Data Model)

ไฟล์ Excel มี 4 sheets ที่เป็นต้นแบบสำหรับ database schema:

### Sheet 1: "Detail" — Trip Records

| Column | Header | Description |
|--------|--------|-------------|
| A | Date | วันที่วิ่งงาน |
| B | Customers | ชื่อลูกค้า |
| C | BL | Bill of Lading number |
| D | Container No | หมายเลขตู้คอนเทนเนอร์ |
| E | Driver name | ชื่อคนขับ |
| F | Price | ราคาต่อเที่ยว |

**Price Tiers (fixed):** 400, 440, 470, 500, 530, 550, 650, 700, 750, 830, 870, 1100
**Employee Code Format:** NPC24XXX (e.g., NPC24015)

---

## 🏗️ Current File Structure (as of 2026-04-22 03:00 GMT+8)

```
fleet-payroll-system/
├── server/
│   ├── index.js                    # Express entry point (serves API + static files)
│   ├── db/
│   │   ├── connection.js           # SQLite connection, auto-init + seed on first run
│   │   ├── schema.sql              # Database schema (tables: drivers, trips, cut_off_periods, adjustments, summaries, line_pairings)
│   │   ├── seed.sql                # 25 drivers seeded from Excel
│   │   ├── init.js                 # Standalone DB init script
│   │   └── seed.js                 # Standalone seed script
│   └── routes/
│       ├── drivers.js              # ✅ FULL CRUD + search
│       ├── trips.js                # ✅ FULL CRUD + batch + auto-recalculate summary
│       ├── periods.js              # ✅ FULL CRUD + status management
│       ├── summaries.js            # ✅ GET summary, recalculate
│       ├── adjustments.js          # ✅ FULL CRUD + auto-recalculate summary
│       ├── line.js                 # ❌ STUB — LINE Bot routes (TODO)
│       └── sheets.js               # ❌ STUB — Google Sheets routes (TODO)
│
├── web/                            # React + Vite frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                 # Router + sidebar layout
│       ├── api.js                  # API client (wraps fetch for all endpoints)
│       ├── index.css               # Global styles (Thai UI, mobile-responsive)
│       └── pages/
│           ├── Trips.jsx           # ✅ Trip entry per period (add/edit/delete)
│           ├── Summary.jsx         # ✅ Salary summary with 12 price tier columns
│           ├── Adjustments.jsx     # ✅ Allowance/deduction management
│           ├── Drivers.jsx         # ✅ Driver list with search
│           └── Periods.jsx         # ✅ Cut-off period management + status
│
├── .env.example                    # Template for env vars
├── .gitignore
├── package.json                    # Backend deps + scripts
├── HANDOFF.md                      # ← YOU ARE HERE
├── README.md
├── data/                           # (gitignored) SQLite DB auto-created here
└── web/dist/                       # (gitignored) Vite build output
```

---

## 🔌 API Endpoints (All Working)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/drivers` | List all drivers |
| GET | `/api/drivers/search?q=` | Search by name/nickname/phone/code |
| GET | `/api/drivers/:id` | Get single driver |
| POST | `/api/drivers` | Create driver |
| PUT | `/api/drivers/:id` | Update driver |
| DELETE | `/api/drivers/:id` | Delete driver |
| GET | `/api/trips?period_id=` | List trips (filter by period) |
| GET | `/api/trips/:id` | Get single trip |
| POST | `/api/trips` | Create trip |
| POST | `/api/trips/batch` | Create multiple trips |
| PUT | `/api/trips/:id` | Update trip |
| DELETE | `/api/trips/:id` | Delete trip |
| GET | `/api/periods` | List all periods |
| GET | `/api/periods/:id` | Get single period |
| POST | `/api/periods` | Create period |
| PUT | `/api/periods/:id` | Update period (status, dates) |
| DELETE | `/api/periods/:id` | Delete period |
| GET | `/api/summaries/:periodId` | Get summary for all drivers in a period |
| GET | `/api/summaries/:periodId/:driverId` | Get summary for specific driver |
| POST | `/api/summaries/:periodId/recalculate` | Force recalculate |
| GET | `/api/adjustments?period_id=` | List adjustments |
| POST | `/api/adjustments` | Create adjustment |
| PUT | `/api/adjustments/:id` | Update adjustment |
| DELETE | `/api/adjustments/:id` | Delete adjustment |

---

## 👥 Driver Data (Seeded — 25 drivers)

| Code | Name | Nickname | Phone |
|------|------|----------|-------|
| NPC24015 | Mr.Naruephon Yusri | Peet | 063-381-0412 |
| NPC24016 | Mr.Suttipong Samanmit | Kung | 062-608-9738 |
| NPC24017 | Mr.Surachai Samanmit | Nong | 061-193-9984 |
| NPC24018 | Mr.Tanonglit Preeda | Arm | 080-260-7088 |
| NPC24019 | Mr.Caichon Laoya | S | — |
| NPC24043 | Mr.Jumlong Sirikhun | Long | 063-392-0867 |
| NPC24061 | Mr.Pisit Kalhapan | Duan | 064-934-4099 |
| NPC24063 | Mr.Tiwa Yotanan | Wa | 063-050-0860 |
| NPC24064 | Mr.Wan Unapan | Wan | 065-034-6038 |
| NPC24070 | Mr.Wiraphong Khongsukkai | — | — |
| NPC24071 | Mr.Phonthep Rakthanyakon | Nueng | 093-260-5169 |
| NPC24075 | Mr.Chinnarat Chuenchuwong | Gee | 063-751-1338 |
| NPC24079 | Mr.Chaiyapat Benjasiri | Lek | 080-579-0842 |
| NPC24080 | Mr.Tanakorn Moonpumsai | Not | 080-765-2671 |
| NPC24081 | Mr.Taweep Raharnnork | Weep | 098-223-7571 |
| NPC24082 | Mr.Pramot Inkaew | Mot | 061-487-4835 |
| NPC24084 | Mr.Saychon Phukang | Ton | 062-608-3991 |
| NPC24089 | Mr.Kittichai Karaphakdi | Nengh | 080-658-0070 |
| NPC24092 | Mr.Ruedirat Charoensuk | Mim | 065-064-3203 |
| NPC24100 | Mr.Wichai Madthuree | Time | 063-246-1057 |
| NPC24117 | Mr.Kittiphong Khongauksorn | Tun | 095-976-9364 |
| NPC24118 | Mr.Piyasakun Chomchuen | Ya | 096-715-6889 |
| NPC24119 | Mr.Worachet Taptep | Miw | 065-034-6038 |
| NPC24120 | Mr.Parichat Sonpanya | Z | 093-260-5169 |
| NPC24122 | Mr.Anuchai Pinitkarn | cocoa | 063-164-7649 |

---

## ✅ What's Already Done

### Backend Core — ✅ COMPLETE
- [x] Project setup with all dependencies
- [x] SQLite schema + seed data (25 drivers)
- [x] Auto-init DB on first run (`server/db/connection.js`)
- [x] Driver CRUD + search API
- [x] Trip CRUD + batch insert API
- [x] Auto-calculate summary on every trip/adjustment change
- [x] Summary API (per-period, per-driver, force recalculate)
- [x] Adjustment CRUD API (allowance/deduction)
- [x] Period CRUD + status management API
- [x] Graceful fallback when frontend not built

### Web Frontend — ✅ COMPLETE (v1)
- [x] React + Vite scaffold
- [x] Sidebar navigation (mobile-responsive)
- [x] Thai language UI throughout
- [x] Trips page — add/edit/delete per period, driver dropdown, price tier selector
- [x] Summary page — full table with 12 price tier columns, grand totals
- [x] Adjustments page — separate sections for allowance/deduction
- [x] Drivers page — list with search, add/edit/delete
- [x] Periods page — create periods, change status (draft → submitted → approved → finalized)
- [x] Toast notifications for all actions
- [x] Empty states with helpful messages

---

## ❌ What's NOT Done (TODO for next agent)

### Priority 1: LINE Bot
- [ ] **LINE webhook handler** — `server/routes/line.js` is a stub
- [ ] **Pairing flow** — name/phone verification → save `line_user_id` in DB
- [ ] **Rich menu** — create + upload image + set postback actions
- [ ] **"เช็คเงินเดือน"** — fetch latest summary, send Flex Message payslip
- [ ] **"งานวิ่งของฉัน"** — driver's trip list as Flex Message
- [ ] **"สลิปย้อนหลัง"** — period selector, historical payslip
- [ ] **"ติดต่อแอดมิน"** — forward message to admin
- [ ] Install `@line/bot-sdk` (already in package.json dependencies)
- [ ] Need `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_CHANNEL_SECRET` in `.env`

### Priority 2: Google Sheets Sync
- [ ] **Service account auth** — `server/routes/sheets.js` is a stub
- [ ] **Export to Sheets** — push trips + summary to spreadsheet
- [ ] **Import from Sheets** — pull changes with diff preview
- [ ] **Auto-sync trigger** — on every save
- [ ] Need `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_SPREADSHEET_ID` in `.env`

### Priority 3: Admin Auth
- [ ] **Simple password gate** — protect admin portal with `ADMIN_PASSWORD` from `.env`
- [ ] **JWT token** — issue on login, verify on API calls
- [ ] `server/middleware/auth.js` — not created yet
- [ ] Login page in frontend

### Priority 4: Frontend Enhancements
- [ ] **Settings page** — LINE config, Google Sheets config UI
- [ ] **"ส่ง Payslip" button** — trigger LINE sends for all drivers in a period
- [ ] **Google Sheets sync button** — manual push/pull from UI
- [ ] **Print/Export** — printable summary sheet (for approval workflow signatures)
- [ ] **Summary page** — expandable per-driver detail (click row to see trip list)
- [ ] **Trip entry** — keyboard shortcuts, quick-entry mode for batch input
- [ ] **Better error handling** — show API errors clearly in UI

### Priority 5: Polish
- [ ] **Loading skeletons** — replace "⏳ กำลังโหลด..." with skeleton screens
- [ ] **Confirmation dialogs** — better UX than `confirm()`
- [ ] **Keyboard navigation** — tab through forms
- [ ] **Dark mode** (optional)

---

## 🔑 Environment Variables (.env.example)

```env
# Server
PORT=3000
JWT_SECRET=your-secret-here

# LINE Bot
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_KEY=    # JSON key content (paste entire JSON)
GOOGLE_SPREADSHEET_ID=

# Admin
ADMIN_PASSWORD=admin123
```

---

## 📌 Key Decisions Made

1. **No driver login** — Driver uses LINE only, no web login needed
2. **Name-based pairing** — Driver verifies by name + phone, not password
3. **1.5-way sync** — Web → Sheets auto, Sheets → Web manual with preview
4. **SQLite over PostgreSQL** — Fleet is small (30 drivers), no need for heavy DB
5. **Flex Messages over PDF** — Rich, beautiful, no file downloads for driver
6. **Price tiers are fixed** — 400, 440, 470, 500, 530, 550, 650, 700, 750, 830, 870, 1100
7. **Auto-recalculate** — Summary updates on every trip/adjustment change (no manual trigger needed for basic flow)
8. **Frontend is SPA** — React Router, served by Express in production, Vite dev proxy in development

---

## 🎯 Success Criteria

The project is done when:
1. ✅ Admin can enter trips on web portal and see auto-calculated summary
2. ❌ Admin clicks "ส่ง Payslip" → all drivers receive LINE message with their pay details
3. ❌ Drivers can tap Rich Menu buttons to check salary, view trips, view history
4. ❌ Data auto-syncs to Google Sheets on every save
5. ✅ Everything works on mobile (admin uses phone to enter data)

---

## 🔧 Dev Notes

- **Database location:** `data/fleet.db` (auto-created on first `npm start`)
- **Frontend build:** `web/dist/` (Express serves this in production)
- **Vite dev proxy:** `web/vite.config.js` proxies `/api` to `localhost:3000`
- **Summary auto-recalc:** Happens inside `POST /api/trips`, `POST /api/trips/batch`, `POST /api/adjustments`, `PUT /api/adjustments/:id`, `DELETE /api/adjustments/:id` — no need to call recalculate endpoint manually
- **The `server/routes/line.js` and `server/routes/sheets.js`** are imported in `server/index.js` but return stub responses — implement these next

---

*Last updated: 2026-04-22 03:14 GMT+8*
*Updated by: OpenClaw agent (webchat session)*
*Changes: Implemented full backend API + React admin portal*
