/*
# Seed DakenDevil's DataLens with synthetic data

## Overview
Populates the assets and relationships tables with the 15 data assets and 21
lineage relationships that power the DataLens hackathon prototype.

## Data Inserted
- 15 assets spanning Files, Pipelines, Tables, Databases, APIs, Reports, and Models
- 21 relationships of types: reads_from, writes_to, feeds, depends_on
- Confidence scores ranging from 0.50 to 0.98

## Notes
1. Uses ON CONFLICT DO NOTHING so re-running is safe (idempotent).
2. Assets are inserted first, then relationships (FK dependency).
3. Data matches the synthetic estate in src/data/estate.ts exactly.
*/

-- Insert assets
INSERT INTO assets (id, name, type, description, owner, team, environment, criticality, sensitivity, lifecycle, modernization_status, last_updated)
VALUES
  ('customer_raw_csv', 'customer_raw.csv', 'File', 'Raw customer data ingested daily from CRM exports containing name, email, phone, and address fields with no cleansing applied.', 'Sarah Chen', 'Data Engineering', 'Production', 'High', 'Confidential', 'Active', 'Retain', '2026-09-18'),
  ('customer_cleaning_etl', 'customer_cleaning_etl', 'Pipeline', 'ETL pipeline that cleanses, deduplicates, and standardizes raw customer data before loading into the master table. Handles phone normalization and address validation.', 'Marcus Rivera', 'Data Engineering', 'Production', 'Critical', 'Confidential', 'Active', 'Remediate', '2026-09-15'),
  ('customer_master', 'customer_master', 'Table', 'Golden-record customer table serving as the single source of truth for customer identity across the organization. Contains verified, deduplicated customer profiles.', 'Sarah Chen', 'Data Engineering', 'Production', 'Critical', 'Confidential', 'Active', 'Retain', '2026-09-17'),
  ('customer_360', 'customer_360', 'Table', 'Enriched 360-degree customer view joining master data with transaction history, engagement metrics, and segmentation attributes for analytics consumption.', 'Priya Nair', 'Analytics', 'Production', 'Critical', 'Internal', 'Active', 'Retain', '2026-09-16'),
  ('customer_dashboard', 'customer_dashboard', 'Report', 'Executive customer health dashboard showing retention rates, segment distribution, and lifetime value. Consumed daily by the leadership team.', 'James Okafor', 'BI Team', 'Production', 'High', 'Internal', 'Active', 'Retain', '2026-09-19'),
  ('sales_transactions', 'sales_transactions', 'Database', 'Production OLTP database storing all sales transaction records including order headers, line items, and payment references. High-volume real-time writes.', 'David Kim', 'Platform Engineering', 'Production', 'Critical', 'Confidential', 'Active', 'Migrate', '2026-09-14'),
  ('sales_etl', 'sales_etl', 'Pipeline', 'Nightly ETL that extracts sales transactions, applies currency conversion, and loads enriched records into the analytics warehouse.', 'Marcus Rivera', 'Data Engineering', 'Production', 'High', 'Internal', 'Active', 'Remediate', '2026-09-13'),
  ('revenue_report', 'revenue_report', 'Report', 'Weekly revenue report aggregating sales by region, product line, and channel. Distributed to finance and executive stakeholders.', 'James Okafor', 'BI Team', 'Production', 'High', 'Confidential', 'Active', 'Retain', '2026-09-12'),
  ('payment_database', 'payment_database', 'Database', 'PCI-compliant payment processing database storing transaction references, payment methods, and settlement records. Strict access controls.', 'Elena Volkov', 'Platform Engineering', 'Production', 'Critical', 'Restricted', 'Legacy', 'Redesign', '2026-08-28'),
  ('crm_customer_table', 'crm_customer_table', 'Table', 'Source customer table from the CRM system providing the raw feed for customer_raw.csv. Contains account-level CRM data including lifecycle stage.', 'Lisa Park', 'Sales Operations', 'Production', 'High', 'Confidential', 'Active', 'Remediate', '2026-09-10'),
  ('analytics_warehouse', 'analytics_warehouse', 'Database', 'Central analytics warehouse consolidating sales, customer, and marketing data for reporting and ML model training. Columnar storage optimized for OLAP.', 'Priya Nair', 'Analytics', 'Production', 'Critical', 'Internal', 'Active', 'Retain', '2026-09-11'),
  ('customer_api', 'customer_api', 'API', 'REST API exposing customer master records to downstream applications including the web storefront and mobile apps. Rate-limited and OAuth-secured.', 'David Kim', 'Platform Engineering', 'Production', 'Critical', 'Confidential', 'Active', 'Migrate', '2026-09-09'),
  ('marketing_segments', 'marketing_segments', 'Table', 'Customer segmentation table mapping customers to marketing cohorts based on engagement, spend, and churn risk scores. Drives campaign targeting.', 'Tom Becker', 'Marketing', 'Production', 'Medium', 'Internal', 'Active', 'Retain', '2026-09-08'),
  ('churn_model', 'churn_model', 'Model', 'Gradient-boosted churn prediction model scoring customers weekly. Outputs churn probability used by customer success and marketing retention campaigns.', 'Priya Nair', 'Analytics', 'Staging', 'High', 'Internal', 'Active', 'Redesign', '2026-09-07'),
  ('executive_report', 'executive_report', 'Report', 'Monthly executive report combining revenue, customer health, churn, and modernization progress into a single board-level briefing document.', 'Lisa Park', 'Sales Operations', 'Production', 'Critical', 'Confidential', 'Active', 'Retain', '2026-09-06')
ON CONFLICT (id) DO NOTHING;

-- Insert relationships
INSERT INTO relationships (id, source, target, relationship_type, confidence)
VALUES
  ('r1', 'crm_customer_table', 'customer_raw_csv', 'feeds', 0.95),
  ('r2', 'customer_raw_csv', 'customer_cleaning_etl', 'reads_from', 0.98),
  ('r3', 'customer_cleaning_etl', 'customer_master', 'writes_to', 0.97),
  ('r4', 'customer_master', 'customer_360', 'feeds', 0.92),
  ('r5', 'customer_360', 'customer_dashboard', 'feeds', 0.90),
  ('r6', 'customer_360', 'churn_model', 'feeds', 0.88),
  ('r7', 'customer_360', 'marketing_segments', 'feeds', 0.85),
  ('r8', 'customer_master', 'customer_api', 'feeds', 0.94),
  ('r9', 'customer_api', 'customer_dashboard', 'depends_on', 0.60),
  ('r10', 'sales_transactions', 'sales_etl', 'feeds', 0.96),
  ('r11', 'sales_etl', 'analytics_warehouse', 'writes_to', 0.93),
  ('r12', 'analytics_warehouse', 'revenue_report', 'feeds', 0.90),
  ('r13', 'analytics_warehouse', 'customer_360', 'feeds', 0.87),
  ('r14', 'analytics_warehouse', 'churn_model', 'feeds', 0.82),
  ('r15', 'sales_etl', 'payment_database', 'reads_from', 0.50),
  ('r16', 'payment_database', 'sales_transactions', 'feeds', 0.78),
  ('r17', 'churn_model', 'marketing_segments', 'feeds', 0.75),
  ('r18', 'churn_model', 'executive_report', 'feeds', 0.80),
  ('r19', 'revenue_report', 'executive_report', 'feeds', 0.83),
  ('r20', 'customer_dashboard', 'executive_report', 'feeds', 0.70),
  ('r21', 'marketing_segments', 'executive_report', 'depends_on', 0.65)
ON CONFLICT (id) DO NOTHING;
