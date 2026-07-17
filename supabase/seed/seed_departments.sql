-- ============================================================
-- seed_departments.sql
-- ============================================================
INSERT INTO departments (name, code, description) VALUES
  ('Education (KVS/NVS)', 'EDU', 'Kendriya Vidyalaya Sangathan & Navodaya Vidyalaya Samiti teachers'),
  ('India Post', 'POST', 'Department of Posts – postal services employees'),
  ('Central Police (CRPF/BSF/CISF)', 'POLICE', 'Central Armed Police Forces personnel'),
  ('Income Tax / Revenue', 'IT', 'Income Tax Department and Revenue Service employees'),
  ('Health (CGHS/Central Hospitals)', 'HEALTH', 'Central Government Health Scheme and central hospital staff');

-- ============================================================
-- seed_designations.sql
-- ============================================================

-- Education
WITH dept AS (SELECT id FROM departments WHERE code = 'EDU')
INSERT INTO designations (department_id, name, pay_level) VALUES
  ((SELECT id FROM dept), 'Principal',             12),
  ((SELECT id FROM dept), 'Vice Principal',        11),
  ((SELECT id FROM dept), 'PGT (English)',         8),
  ((SELECT id FROM dept), 'PGT (Hindi)',           8),
  ((SELECT id FROM dept), 'PGT (Mathematics)',     8),
  ((SELECT id FROM dept), 'PGT (Science)',         8),
  ((SELECT id FROM dept), 'PGT (Social Science)',  8),
  ((SELECT id FROM dept), 'PGT (Commerce)',        8),
  ((SELECT id FROM dept), 'PGT (Computer Science)',8),
  ((SELECT id FROM dept), 'TGT (English)',         7),
  ((SELECT id FROM dept), 'TGT (Hindi)',           7),
  ((SELECT id FROM dept), 'TGT (Mathematics)',     7),
  ((SELECT id FROM dept), 'TGT (Science)',         7),
  ((SELECT id FROM dept), 'TGT (Social Science)',  7),
  ((SELECT id FROM dept), 'PRT (Primary Teacher)', 6),
  ((SELECT id FROM dept), 'Librarian',             6),
  ((SELECT id FROM dept), 'Staff Nurse',           7),
  ((SELECT id FROM dept), 'LDC / Clerk',           2),
  ((SELECT id FROM dept), 'UDC',                   4);

-- India Post
WITH dept AS (SELECT id FROM departments WHERE code = 'POST')
INSERT INTO designations (department_id, name, pay_level) VALUES
  ((SELECT id FROM dept), 'Senior Superintendent of Post Offices', 10),
  ((SELECT id FROM dept), 'Superintendent of Post Offices',         9),
  ((SELECT id FROM dept), 'Postmaster Grade I',                     7),
  ((SELECT id FROM dept), 'Postmaster Grade II',                    6),
  ((SELECT id FROM dept), 'Postmaster Grade III',                   5),
  ((SELECT id FROM dept), 'Inspector of Post Offices',              7),
  ((SELECT id FROM dept), 'Postal Assistant',                       4),
  ((SELECT id FROM dept), 'Sorting Assistant',                      4),
  ((SELECT id FROM dept), 'Multi Tasking Staff (MTS)',              1);

-- Central Police
WITH dept AS (SELECT id FROM departments WHERE code = 'POLICE')
INSERT INTO designations (department_id, name, pay_level) VALUES
  ((SELECT id FROM dept), 'Inspector',                             7),
  ((SELECT id FROM dept), 'Sub Inspector (SI)',                    6),
  ((SELECT id FROM dept), 'Assistant Sub Inspector (ASI)',         5),
  ((SELECT id FROM dept), 'Head Constable',                       4),
  ((SELECT id FROM dept), 'Constable (GD)',                       3),
  ((SELECT id FROM dept), 'Constable (Technical)',                 3);

-- Income Tax / Revenue
WITH dept AS (SELECT id FROM departments WHERE code = 'IT')
INSERT INTO designations (department_id, name, pay_level) VALUES
  ((SELECT id FROM dept), 'Income Tax Officer (ITO)',              8),
  ((SELECT id FROM dept), 'Inspector of Income Tax',               7),
  ((SELECT id FROM dept), 'Tax Assistant',                         4),
  ((SELECT id FROM dept), 'Stenographer Grade II',                 4),
  ((SELECT id FROM dept), 'Stenographer Grade III',                4),
  ((SELECT id FROM dept), 'Multi Tasking Staff (MTS)',             1);

-- Health
WITH dept AS (SELECT id FROM departments WHERE code = 'HEALTH')
INSERT INTO designations (department_id, name, pay_level) VALUES
  ((SELECT id FROM dept), 'Chief Medical Officer',                12),
  ((SELECT id FROM dept), 'Senior Medical Officer',              10),
  ((SELECT id FROM dept), 'Medical Officer',                      9),
  ((SELECT id FROM dept), 'Staff Nurse',                          7),
  ((SELECT id FROM dept), 'Pharmacist',                           5),
  ((SELECT id FROM dept), 'Radiographer',                         5),
  ((SELECT id FROM dept), 'Lab Technician',                       5),
  ((SELECT id FROM dept), 'LDC / Clerk',                          2),
  ((SELECT id FROM dept), 'UDC',                                  4),
  ((SELECT id FROM dept), 'Multi Tasking Staff (MTS)',            1);
