export type AssetType =
  | 'File'
  | 'Pipeline'
  | 'Table'
  | 'Database'
  | 'API'
  | 'Report'
  | 'Model';

export type Criticality = 'Critical' | 'High' | 'Medium' | 'Low';
export type Sensitivity = 'Public' | 'Internal' | 'Confidential' | 'Restricted';
export type Lifecycle = 'Active' | 'Legacy' | 'Deprecated' | 'Archived';
export type ModernizationStatus =
  | 'Retain'
  | 'Remediate'
  | 'Migrate'
  | 'Redesign'
  | 'Retire';
export type Environment = 'Production' | 'Staging' | 'Development';
export type RelationshipType =
  | 'reads_from'
  | 'writes_to'
  | 'feeds'
  | 'depends_on';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  description: string;
  owner: string;
  team: string;
  environment: Environment;
  criticality: Criticality;
  sensitivity: Sensitivity;
  lifecycle: Lifecycle;
  modernizationStatus: ModernizationStatus;
  lastUpdated: string;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  relationshipType: RelationshipType;
  confidence: number;
}

export interface ImpactResult {
  assetId: string;
  directImpact: ImpactNode[];
  indirectImpact: ImpactNode[];
  totalAffected: number;
  criticalAffected: number;
  teamsImpacted: number;
  downstreamCount: number;
  explanation: string;
}

export interface ImpactNode {
  asset: Asset;
  hopDistance: number;
  impactType: 'DIRECT' | 'INDIRECT';
  reason: string;
}

export interface AiOverview {
  whatItIs: string;
  risk: string;
  sensitivity: string;
  dependencies: string;
  nextSteps: string[];
}
