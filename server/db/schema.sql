-- NPC Fleet Payroll System — SQLite Schema

-- คนขับรถ
CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_code TEXT UNIQUE NOT NULL,   -- NPC24015
  full_name TEXT NOT NULL,               -- Mr.Naruephon Yusri
  nickname TEXT,                         -- Peet
  phone TEXT,                            -- 063-381-0412
  line_user_id TEXT UNIQUE,              -- LINE User ID (หลังจับคู่)
  vehicle_plate TEXT,                    -- ทะเบียนรถ
  unit_type TEXT DEFAULT '30',           -- '30' or '20'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cut-off period (รอบจ่ายเงิน)
CREATE TABLE IF NOT EXISTS cut_off_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  title TEXT,                            -- "CUT OFF 11 MAR - 20 MAR 2026"
  status TEXT DEFAULT 'draft',           -- draft, submitted, approved, finalized
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- เที่ยววิ่ง
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_id INTEGER REFERENCES cut_off_periods(id),
  trip_date DATE NOT NULL,
  customer TEXT,
  bl_number TEXT,
  container_no TEXT,
  driver_id INTEGER REFERENCES drivers(id),
  price INTEGER NOT NULL,                -- 400, 440, 470, 500, 530, 550, 650, 700, 750, 830, 870, 1100
  unit_type TEXT DEFAULT '30',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- เงินพิเศษ (เพิ่ม/หัก)
CREATE TABLE IF NOT EXISTS adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_id INTEGER REFERENCES cut_off_periods(id),
  driver_id INTEGER REFERENCES drivers(id),
  type TEXT NOT NULL CHECK(type IN ('allowance', 'deduction')),
  amount INTEGER NOT NULL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- สรุปรายได้ (auto-calculated cache)
CREATE TABLE IF NOT EXISTS summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_id INTEGER REFERENCES cut_off_periods(id),
  driver_id INTEGER REFERENCES drivers(id),
  trip_counts TEXT,                      -- JSON: {"400":2, "550":7, ...}
  total_trips INTEGER DEFAULT 0,
  total_income INTEGER DEFAULT 0,
  total_allowances INTEGER DEFAULT 0,
  total_deductions INTEGER DEFAULT 0,
  net_income INTEGER DEFAULT 0,
  UNIQUE(period_id, driver_id)
);

-- LINE pairing
CREATE TABLE IF NOT EXISTS line_pairings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_user_id TEXT UNIQUE NOT NULL,
  driver_id INTEGER REFERENCES drivers(id),
  paired_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trips_period ON trips(period_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_adjustments_period ON adjustments(period_id);
CREATE INDEX IF NOT EXISTS idx_summaries_period ON summaries(period_id);
