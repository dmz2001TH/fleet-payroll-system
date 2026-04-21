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

### Existing Reference

User มี Excel template อยู่แล้ว — ไฟล์อยู่ที่ `/tmp/template.xlsx` (ดู structure ข้างล่าง)
GitHub โปรเจ็คเก่าที่มี LINE + Google Sheets integration: https://github.com/dmz2001TH/driver-expense-tracker

---

## 📊 Excel Structure (Source of Truth สำหรับ Data Model)

ไฟล์ Excel มี 4 sheets ที่เป็นต้นแบบสำหรับ database schema:

### Sheet 1: "Detail" — Trip Records (A1:N50+)

| Column | Header | Description |
|--------|--------|-------------|
| A | Date | วันที่วิ่งงาน |
| B | Customers | ชื่อลูกค้า |
| C | BL | Bill of Lading number |
| D | Container No | หมายเลขตู้คอนเทนเนอร์ |
| E | Driver name | ชื่อคนขับ (มี format "เบอร์ สป/สบ : ท.3/ท.4 ชื่อ นามสกุล (ชื่อเล่น) เบอร์โทร") |
| F | Price | ราคาต่อเที่ยว (ค่าคงที่: 400, 440, 470, 500, 530, 550, 650, 700, 750, 830, 870, 1100) |

มี 2 กลุ่ม: 30 Unit (ซ้าย A-G) และ 20 Unit (ขวา H-N) — same columns
ข้อมูลจริงเริ่ม row 3 (index 2) เพราะ row 1-2 เป็น header

### Sheet 2: "Summery" — Auto-calculated Summary (A1:AA30+)

| Column | Content |
|--------|---------|
| Row 0 | Title: "CUT OFF DD MON - DD MON YYYY" |
| Row 1 | Price tiers (400, 440, 470, 500, 530, 550, 650, 700, 750, 830, 870, 1100) + Total column |
| Row 2 | Total trips per price tier (aggregate) |
| Row 3 | Total income per price tier (trips × price) |
| Row 4+ | Per-driver: ลำดับ, รหัสพนักงาน (NPC24XXX), ชื่อ, จำนวนเที่ยวแต่ละ price tier, รวม |

**Employee Code Format:** NPC24XXX (e.g., NPC24015, NPC24016)
**Name Format:** Mr. Firstname Lastname (Nickname) — บางชื่อมีภาษาจีน/อังกฤษปน

**Price Tiers (fixed):** 400, 440, 470, 500, 530, 550, 650, 700, 750, 830, 870, 1100

Rows 28-46: Approval section (SUBMIT BY / DEPT. APPROVE BY / FINAL APPROVE BY) — signature lines

### Sheet 3: "Special Allowance and Deducted" (A1:E30+)

**Section 1: Allowance (เพิ่ม)**
| Column | Header |
|--------|--------|
| A | ลำดับ (sequence) |
| B | รหัสพนักงาน (employee code) |
| C | รายชื่อพนักงาน (employee name) |
| D | จำนวนเงิน (amount) |
| E | เหตุผล (reason) |

**Section 2: Deduction (หัก)** — same structure, starts at row 14

### Sheet 4: "Summery" (duplicate) — Same as Sheet 2

---

## 👥 Driver Data (Extracted from Excel)

Employee codes and names found in the data:

| Code | Name | Nickname |
|------|------|----------|
| NPC24015 | Mr.Naruephon Yusri | Peet |
| NPC24016 | Mr.Suttipong Samanmit | Kung |
| NPC24017 | Mr.Surachai Samanmit | Nong |
| NPC24018 | Mr.Tanonglit Preeda | Arm |
| NPC24019 | Mr.Caichon Laoya | S |
| NPC24122 | Mr. Anuchai Pinitkarn | cocoa |
| NPC24043 | Mr.Jumlong Sirikhun | Long |
| NPC24120 | Mr.Parichat Sonpanya | Z |
| NPC24061 | Mr.Pisit Kalhapan | Duan |
| NPC24063 | Mr.Tiwa Yotanan | Wa |
| NPC24064 | Mr.Wan Unapan | Wan |
| NPC24071 | Mr.Phonthep Rakthanyakon | Nueng |
| NPC24075 | Mr.Chinnarat Chuenchuwong | Gee |
| NPC24079 | Mr.Chaiyapat Benjasiri | Lek |
| NPC24080 | Mr.Tanakorn Moonpumsai | Not |
| NPC24081 | Mr.Taweep Raharnnork | Weep |
| NPC24082 | Mr.Pramot Inkaew | Mot |
| NPC24084 | Mr.Saychon Phukang | Ton |
| NPC24089 | Mr.Kittichai Karaphakdi | Nengh |
| NPC24092 | Mr.Ruedirat Charoensuk | Mim |
| NPC24100 | Mr.Wichai Madthuree | Time |
| NPC24117 | Mr.Kittiphong Khongauksorn | Tun |
| NPC24118 | Mr.Piyasakun Chomchuen | Ya |
| NPC24119 | Mr.Worachet Taptep | Miw |

---

## 🏗️ Architecture

```
fleet-payroll-system/
├── server/                    # Node.js + Express backend
│   ├── index.js              # Entry point
│   ├── routes/
│   │   ├── trips.js          # CRUD เที่ยววิ่ง
│   │   ├── summary.js        # Auto-calculate summary
│   │   ├── allowance.js      # Allowance/Deduction CRUD
│   │   ├── drivers.js        # Driver management
│   │   └── sheets.js         # Google Sheets sync
│   ├── db/
│   │   ├── schema.sql        # SQLite schema
│   │   └── seed.sql          # Seed data (drivers from Excel)
│   ├── services/
│   │   ├── line.js           # LINE Messaging API
│   │   ├── sheets-sync.js    # Google Sheets sync service
│   │   └── calculator.js     # Payroll calculation logic
│   └── middleware/
│       └── auth.js           # Admin auth (simple)
│
├── web/                       # React/Vue frontend (admin portal)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Trips.jsx     # กรอกเที่ยววิ่ง (Detail)
│   │   │   ├── Summary.jsx   # สรุปรายได้ (Summery)
│   │   │   ├── Allowances.jsx # เพิ่ม/หักเงินพิเศษ
│   │   │   ├── Drivers.jsx   # จัดการรายชื่อ driver
│   │   │   └── Settings.jsx  # LINE/Google Sheets config
│   │   └── App.jsx
│   └── package.json
│
├── line-bot/                  # LINE Bot (separate or integrated)
│   ├── webhook.js            # LINE webhook handler
│   ├── rich-menu.js          # Rich menu setup
│   ├── flex-messages.js      # Payslip / Summary flex messages
│   └── pairing.js            # จับคู่บัญชี (name + phone verify)
│
├── .env.example
├── package.json
└── README.md
```

### Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Backend | Node.js + Express | ตรงกับ skill เดิมที่มี |
| Database | SQLite (via better-sqlite3) | เบา ไม่ต้อง setup server เหมาะ fleet 30 คน |
| Frontend | React + Vite | Fast dev, mobile-first |
| LINE Bot | LINE Messaging API + Flex Message | ส่ง payslip สวยๆ |
| Google Sheets | googleapis npm package | Sync export |
| Auth (admin) | Simple password + JWT | ไม่ซับซ้อน |

---

## 📐 Database Schema (SQLite)

```sql
-- คนขับรถ
CREATE TABLE drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_code TEXT UNIQUE NOT NULL,  -- NPC24015
  name TEXT NOT NULL,                   -- Mr.Naruephon Yusri
  nickname TEXT,                        -- Peet
  phone TEXT,                           -- 063-381-0412
  line_user_id TEXT UNIQUE,             -- LINE User ID (after pairing)
  vehicle_plate TEXT,                   -- ทะเบียนรถ
  unit_type TEXT DEFAULT '30',          -- '30' or '20'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- กลุ่มเที่ยววิ่ง (cut-off period)
CREATE TABLE cut_off_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'draft',          -- draft, submitted, approved, finalized
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- เที่ยววิ่ง
CREATE TABLE trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_id INTEGER REFERENCES cut_off_periods(id),
  trip_date DATE NOT NULL,
  customer TEXT,
  bl_number TEXT,
  container_no TEXT,
  driver_id INTEGER REFERENCES drivers(id),
  price INTEGER NOT NULL,               -- 400, 440, 470, 500, 530, 550, 650, 700, 750, 830, 870, 1100
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- เงินพิเศษเพิ่ม/หัก
CREATE TABLE adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_id INTEGER REFERENCES cut_off_periods(id),
  driver_id INTEGER REFERENCES drivers(id),
  type TEXT NOT NULL,                   -- 'allowance' or 'deduction'
  amount INTEGER NOT NULL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- สรุปรายได้ (auto-calculated, cache)
CREATE TABLE summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_id INTEGER REFERENCES cut_off_periods(id),
  driver_id INTEGER REFERENCES drivers(id),
  trip_counts TEXT,                     -- JSON: {"400":2, "550":7, ...}
  total_trips INTEGER,
  total_income INTEGER,
  total_allowances INTEGER,
  total_deductions INTEGER,
  net_income INTEGER,                   -- total_income + allowances - deductions
  UNIQUE(period_id, driver_id)
);

-- LINE pairing sessions
CREATE TABLE line_pairings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_user_id TEXT UNIQUE NOT NULL,
  driver_id INTEGER REFERENCES drivers(id),
  paired_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🤖 LINE Bot Design

### Rich Menu Layout

```
┌─────────────────────────────────────┐
│          NPC Driver Portal          │
├──────────────────┬──────────────────┤
│ 💰 เช็คเงินเดือน │ 🚛 งานวิ่งของฉัน │
├──────────────────┼──────────────────┤
│ 📋 สลิปย้อนหลัง │ 📞 ติดต่อแอดมิน  │
├──────────────────┴──────────────────┤
│        📘 วิธีใช้งาน                 │
└─────────────────────────────────────┘
```

### Pairing Flow (จับคู่บัญชี)

```
Driver → Add LINE OA as friend
Bot: "สวัสดีครับ 👋 พิมพ์ชื่อเล่น หรือเบอร์โทรเพื่อยืนยันตัวตนครับ"
Driver: "Peet"  (or phone number)
Bot: finds matching driver(s) in DB
     → If 1 match: "คุณคือ Mr.Naruephon Yusri (Peet) ใช่มั้ยครับ?" [✅ ใช่] [❌ ไม่ใช่]
     → If multiple: shows list to pick
     → If no match: "ไม่พบชื่อนี้ครับ กรุณาติดต่อแอดมิน"
Driver: confirms
Bot: "จับคู่เรียบร้อย ✅ คราวหน้าไม่ต้องยืนยันอีก"
→ Save line_user_id ↔ driver_id in line_pairings table
```

### Flex Message — Payslip

```
┌─────────────────────────────┐
│ 📄 NPC PAYSLIP              │
│ Period: 11 MAR - 20 MAR 2026│
├─────────────────────────────┤
│ Driver: Peet (NPC24015)     │
├─────────────────────────────┤
│ 550฿  ×  7 trips = 3,850   │
│ 870฿  ×  3 trips = 2,610   │
├─────────────────────────────┤
│ Total Trips:     10         │
│ Gross Income:    6,460      │
│ Allowance:         +200     │
│ Deduction:           0      │
│ ═══════════════════════     │
│ NET INCOME:      6,660 ฿   │
└─────────────────────────────┘
```

---

## 🔄 Google Sheets Sync Strategy

**Design: 1.5-way sync (not full 2-way)**

- **Web → Sheets**: Auto-sync on every save (real-time export)
- **Sheets → Web**: Manual "Pull from Sheet" button with preview before confirm
- **Conflict rule**: Web is source of truth; Sheet edits require manual review

### Sync Direction

```
Web Portal ────(auto)────► Google Sheets
     ▲
     │────(manual pull)──── Google Sheets
```

---

## ✅ What's Already Done (in this session)

- [x] Analyzed existing Excel template structure
- [x] Designed database schema
- [x] Designed LINE bot flow + Rich Menu
- [x] Designed architecture and file structure
- [x] Designed Google Sheets sync strategy (1.5-way)
- [x] Identified all driver names/codes from Excel
- [x] Created this handoff document

---

## ❌ What's NOT Done (TODO for next agent)

### Priority 1: Backend Core
- [ ] **Set up project** — `npm init`, install dependencies (express, better-sqlite3, googleapis, @line/bot-sdk, jsonwebtoken, cors)
- [ ] **Create SQLite schema** — Implement `db/schema.sql` and `db/seed.sql`
- [ ] **Trip CRUD API** — `POST /api/trips`, `GET /api/trips`, `PUT /api/trips/:id`, `DELETE /api/trips/:id`
- [ ] **Auto-calculate summary** — `GET /api/summaries/:periodId` — Group trips by driver × price tier, compute totals
- [ ] **Allowance/Deduction CRUD** — `POST /api/adjustments`, `GET /api/adjustments/:periodId`
- [ ] **Cut-off period management** — `POST /api/periods`, `GET /api/periods`
- [ ] **Driver management** — `GET /api/drivers`, `POST /api/drivers`, search by name/nickname/phone

### Priority 2: LINE Bot
- [ ] **LINE webhook setup** — Handle incoming messages and postback events
- [ ] **Pairing flow** — Implement name/phone verification → save LINE User ID
- [ ] **Rich menu creation** — Create and upload rich menu image, set actions
- [ ] **"เช็คเงินเดือน" handler** — Fetch latest period summary, send Flex Message
- [ ] **"งานวิ่งของฉัน" handler** — Fetch driver's trips, send list as Flex Message
- [ ] **"สลิปย้อนหลัง" handler** — Show period selector, send historical payslip
- [ ] **"ติดต่อแอดมิน" handler** — Forward message to admin

### Priority 3: Google Sheets Sync
- [ ] **Service account auth** — Load credentials from .env or config
- [ ] **Export to Sheets** — Push trip data + summary to designated spreadsheet
- [ ] **Import from Sheets** — Pull changes from Sheet, show diff preview
- [ ] **Sync trigger** — Auto on save + manual button

### Priority 4: Web Frontend (Admin Portal)
- [ ] **Trip entry form** — Date, customer, BL, container, driver dropdown, price tier
- [ ] **Summary view** — Table matching Excel "Summery" layout, with totals
- [ ] **Allowance/Deduction form** — Add/remove adjustments per period
- [ ] **Driver list** — View/edit driver info
- [ ] **Period management** — Create periods, change status (draft → approved)
- [ ] **Settings page** — LINE config, Google Sheets config
- [ ] **"ส่ง Payslip" button** — Trigger LINE sends for all drivers in period

### Priority 5: Polish
- [ ] **Mobile-responsive** — Admin portal must work on phone (user accesses from phone)
- [ ] **Error handling** — Validate inputs, handle API errors gracefully
- [ ] **Thai language UI** — All labels in Thai
- [ ] **Print/Export** — Generate printable summary sheet (for approval workflow)

---

## 🔑 Environment Variables Needed

```env
# Server
PORT=3000
JWT_SECRET=your-secret-here

# LINE
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_KEY=    # JSON key content
GOOGLE_SPREADSHEET_ID=

# Admin
ADMIN_PASSWORD=                 # Simple password for admin login
```

---

## 📌 Key Decisions Made

1. **No driver login** — Driver uses LINE only, no web login needed
2. **Name-based pairing** — Driver verifies by name + phone, not password
3. **1.5-way sync** — Web → Sheets auto, Sheets → Web manual with preview
4. **SQLite over PostgreSQL** — Fleet is small (30 drivers), no need for heavy DB
5. **Flex Messages over PDF** — Rich, beautiful, no file downloads for driver
6. **Price tiers are fixed** — 400, 440, 470, 500, 530, 550, 650, 700, 750, 830, 870, 1100

---

## 🎯 Success Criteria

The project is done when:
1. Admin can enter trips on web portal and see auto-calculated summary
2. Admin clicks "ส่ง Payslip" → all drivers receive LINE message with their pay details
3. Drivers can tap Rich Menu buttons to check salary, view trips, view history
4. Data auto-syncs to Google Sheets on every save
5. Everything works on mobile (admin uses phone to enter data)

---

*Handoff created: 2026-04-22 00:45 GMT+8*
*Previous agent: OpenClaw main session*
*Original user: dmz2001TH (GitHub)*
