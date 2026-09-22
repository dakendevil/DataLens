/*
# DakenDevil's DataLens — Create assets and relationships tables

## Overview
Creates the core database schema for the DataLens data estate intelligence platform.
Two tables store data assets and their lineage relationships, matching the existing
TypeScript types in src/types/index.ts.

## New Tables

### assets
- id (text, primary key) — human-readable slug identifier (e.g. "customer_raw_csv")
- name (text, not null) — display name of the asset
- type (text, not null) — asset type: File, Pipeline, Table, Database, API, Report, Model
- description (text, not null) — plain-language description of the asset
- owner (text, not null) — person responsible for the asset
- team (text, not null) — team that owns the asset
- environment (text, not null) — Production, Staging, or Development
- criticality (text, not null) — Critical, High, Medium, or Low
- sensitivity (text, not null) — Public, Internal, Confidential, or Restricted
- lifecycle (text, not null) — Active, Legacy, Deprecated, or Archived
- modernization_status (text, not null) — Retain, Remediate, Migrate, Redesign, or Retire
- last_updated (date, not null) — date of last modification
- created_at (timestamptz, default now()) — record creation timestamp

### relationships
- id (text, primary key) — unique relationship identifier (e.g. "r1")
- source (text, not null, FK → assets.id) — upstream asset
- target (text, not null, FK → assets.id) — downstream asset
- relationship_type (text, not null) — reads_from, writes_to, feeds, depends_on
- confidence (numeric, not null, 0–1) — confidence score for this edge
- created_at (timestamptz, default now()) — record creation timestamp

## Security
- RLS enabled on both tables.
- Single-tenant (no auth): policies use TO anon, authenticated with USING (true)
  because the data is intentionally shared/public for this hackathon prototype.
- All four CRUD policies (SELECT, INSERT, UPDATE, DELETE) created per table.

## Notes
1. Uses IF NOT EXISTS for idempotency — safe to re-run.
2. Foreign keys on relationships reference assets with ON DELETE CASCADE so
   deleting an asset automatically removes its relationships.
3. Check constraints enforce valid enum values on type, criticality, sensitivity,
   lifecycle, modernization_status, environment, and relationship_type columns.
4. Confidence is constrained to the range [0, 1].
*/

-- =========================================================
-- assets table
-- =========================================================
CREATE TABLE IF NOT EXISTS assets (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('File', 'Pipeline', 'Table', 'Database', 'API', 'Report', 'Model')),
  description text NOT NULL,
  owner text NOT NULL,
  team text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('Production', 'Staging', 'Development')),
  criticality text NOT NULL CHECK (criticality IN ('Critical', 'High', 'Medium', 'Low')),
  sensitivity text NOT NULL CHECK (sensitivity IN ('Public', 'Internal', 'Confidential', 'Restricted')),
  lifecycle text NOT NULL CHECK (lifecycle IN ('Active', 'Legacy', 'Deprecated', 'Archived')),
  modernization_status text NOT NULL CHECK (modernization_status IN ('Retain', 'Remediate', 'Migrate', 'Redesign', 'Retire')),
  last_updated date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_assets" ON assets;
CREATE POLICY "anon_select_assets" ON assets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_assets" ON assets;
CREATE POLICY "anon_insert_assets" ON assets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_assets" ON assets;
CREATE POLICY "anon_update_assets" ON assets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_assets" ON assets;
CREATE POLICY "anon_delete_assets" ON assets FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- relationships table
-- =========================================================
CREATE TABLE IF NOT EXISTS relationships (
  id text PRIMARY KEY,
  source text NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  target text NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('reads_from', 'writes_to', 'feeds', 'depends_on')),
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_relationships" ON relationships;
CREATE POLICY "anon_select_relationships" ON relationships FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_relationships" ON relationships;
CREATE POLICY "anon_insert_relationships" ON relationships FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_relationships" ON relationships;
CREATE POLICY "anon_update_relationships" ON relationships FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_relationships" ON relationships;
CREATE POLICY "anon_delete_relationships" ON relationships FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- Indexes
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_criticality ON assets(criticality);
CREATE INDEX IF NOT EXISTS idx_assets_owner ON assets(owner);
CREATE INDEX IF NOT EXISTS idx_assets_environment ON assets(environment);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target);
