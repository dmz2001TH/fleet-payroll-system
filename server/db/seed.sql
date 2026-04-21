-- NPC Fleet Payroll System — Seed Data
-- Driver names extracted from Excel template

INSERT OR IGNORE INTO drivers (employee_code, full_name, nickname, phone, unit_type) VALUES
('NPC24015', 'Mr.Naruephon Yusri', 'Peet', '063-381-0412', '30'),
('NPC24016', 'Mr.Suttipong Samanmit', 'Kung', '062-608-9738', '30'),
('NPC24017', 'Mr.Surachai Samanmit', 'Nong', '061-193-9984', '30'),
('NPC24018', 'Mr.Tanonglit Preeda', 'Arm', '080-260-7088', '30'),
('NPC24019', 'Mr.Caichon Laoya', 'S', NULL, '30'),
('NPC24122', 'Mr.Anuchai Pinitkarn', 'cocoa', '063-164-7649', '30'),
('NPC24043', 'Mr.Jumlong Sirikhun', 'Long', '063-392-0867', '30'),
('NPC24120', 'Mr.Parichat Sonpanya', 'Z', '093-260-5169', '30'),
('NPC24061', 'Mr.Pisit Kalhapan', 'Duan', '064-934-4099', '30'),
('NPC24063', 'Mr.Tiwa Yotanan', 'Wa', '063-050-0860', '30'),
('NPC24064', 'Mr.Wan Unapan', 'Wan', '065-034-6038', '30'),
('NPC24071', 'Mr.Phonthep Rakthanyakon', 'Nueng', '093-260-5169', '30'),
('NPC24075', 'Mr.Chinnarat Chuenchuwong', 'Gee', '063-751-1338', '30'),
('NPC24079', 'Mr.Chaiyapat Benjasiri', 'Lek', '080-579-0842', '30'),
('NPC24080', 'Mr.Tanakorn Moonpumsai', 'Not', '080-765-2671', '30'),
('NPC24081', 'Mr.Taweep Raharnnork', 'Weep', '098-223-7571', '30'),
('NPC24082', 'Mr.Pramot Inkaew', 'Mot', '061-487-4835', '30'),
('NPC24084', 'Mr.Saychon Phukang', 'Ton', '062-608-3991', '30'),
('NPC24089', 'Mr.Kittichai Karaphakdi', 'Nengh', '080-658-0070', '30'),
('NPC24092', 'Mr.Ruedirat Charoensuk', 'Mim', '065-064-3203', '30'),
('NPC24100', 'Mr.Wichai Madthuree', 'Time', '063-246-1057', '30'),
('NPC24117', 'Mr.Kittiphong Khongauksorn', 'Tun', '095-976-9364', '30'),
('NPC24118', 'Mr.Piyasakun Chomchuen', 'Ya', '096-715-6889', '30'),
('NPC24119', 'Mr.Worachet Taptep', 'Miw', '065-034-6038', '30'),
('NPC24070', 'Mr.Wiraphong Khongsukkai', NULL, NULL, '30');

-- Price tiers reference (constant, not in DB but for documentation):
-- 400, 440, 470, 500, 530, 550, 650, 700, 750, 830, 870, 1100
