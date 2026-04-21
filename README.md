# 🚛 NPC Fleet Payroll System

ระบบจัดการเงินเดือนและเที่ยววิ่งคนขับรถ — สำหรับ NPC Logistics

## Features

- 📝 บันทึกเที่ยววิ่งผ่าน Web Portal
- 📊 คำนวณรายได้อัตโนมัติ แยกตาม price tier
- 💬 ส่ง Payslip ผ่าน LINE Official Account อัตโนมัติ
- 📋 Sync ข้อมูลไป Google Sheets
- 🔗 จับคู่บัญชี LINE ด้วยชื่อ — ไม่ต้องจำรหัส

## Quick Start

```bash
cd fleet-payroll-system
npm install
cp .env.example .env
# แก้ไข .env ตามต้องการ
npm start
```

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **LINE Bot:** LINE Messaging API + Flex Message
- **Frontend:** React + Vite
- **Sync:** Google Sheets API

## Documentation

ดู [`HANDOFF.md`](./HANDOFF.md) สำหรับข้อมูลละเอียดทั้งหมด — architecture, database schema, LINE bot flow, TODO list

## Status

🚧 **In Development** — ดู HANDOFF.md สำหรับสถานะล่าสุด

## License

Private — NPC Logistics
