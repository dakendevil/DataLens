import { createClient } from '@supabase/supabase-js';
import type { Asset, Relationship } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Row types from Supabase (snake_case columns)
interface AssetRow {
  id: string;
  name: string;
  type: Asset['type'];
  description: string;
  owner: string;
  team: string;
  environment: Asset['environment'];
  criticality: Asset['criticality'];
  sensitivity: Asset['sensitivity'];
  lifecycle: Asset['lifecycle'];
  modernization_status: Asset['modernizationStatus'];
  last_updated: string;
}

interface RelationshipRow {
  id: string;
  source: string;
  target: string;
  relationship_type: Relationship['relationshipType'];
  confidence: number;
}

function mapAssetRow(row: AssetRow): Asset {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    owner: row.owner,
    team: row.team,
    environment: row.environment,
    criticality: row.criticality,
    sensitivity: row.sensitivity,
    lifecycle: row.lifecycle,
    modernizationStatus: row.modernization_status,
    lastUpdated: row.last_updated,
  };
}

function mapRelationshipRow(row: RelationshipRow): Relationship {
  return {
    id: row.id,
    source: row.source,
    target: row.target,
    relationshipType: row.relationship_type,
    confidence: row.confidence,
  };
}

export async function fetchAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data as AssetRow[]).map(mapAssetRow);
}

export async function fetchRelationships(): Promise<Relationship[]> {
  const { data, error } = await supabase
    .from('relationships')
    .select('*');
  if (error) throw error;
  return (data as RelationshipRow[]).map(mapRelationshipRow);
}
