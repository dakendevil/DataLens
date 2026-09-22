import type { Asset, AiOverview } from '@/types';
import { calculateImpact, getDirectDownstream, getDirectUpstream, getConnectionCount } from '@/lib/graph';

export function generateAiOverview(asset: Asset): AiOverview {
  const impact = calculateImpact(asset.id);
  const upstream = getDirectUpstream(asset.id);
  const downstream = getDirectDownstream(asset.id);
  const connections = getConnectionCount(asset.id);

  const whatItIs = `${asset.name} is a ${asset.type.toLowerCase()} in the ${asset.environment} environment, owned by ${asset.owner} (${asset.team}). ${asset.description}`;

  const riskLevel =
    asset.criticality === 'Critical' ? 'severe' :
    asset.criticality === 'High' ? 'high' :
    asset.criticality === 'Medium' ? 'moderate' : 'low';

  const risk = `This asset carries ${riskLevel} risk. It has ${downstream.length} direct downstream dependent${downstream.length !== 1 ? 's' : ''} and ${connections} total connection${connections !== 1 ? 's' : ''} in the lineage graph. ${impact.totalAffected > 0 ? `A change or deletion would cascade to ${impact.totalAffected} asset${impact.totalAffected !== 1 ? 's' : ''} across ${impact.teamsImpacted} team${impact.teamsImpacted !== 1 ? 's' : ''}, including ${impact.criticalAffected} high-criticality asset${impact.criticalAffected !== 1 ? 's' : ''}.` : 'It has no downstream dependents, so changes are relatively contained.'}${asset.lifecycle === 'Legacy' ? ' Its legacy status increases operational risk.' : ''}`;

  const sensitivityMap: Record<string, string> = {
    Public: 'This asset contains public-facing data with no access restrictions.',
    Internal: 'This asset contains internal-use data that should not be exposed externally.',
    Confidential: 'This asset contains confidential business data requiring restricted access.',
    Restricted: 'This asset contains restricted data subject to compliance and regulatory controls.',
  };

  const sensitivity = `${sensitivityMap[asset.sensitivity] ?? 'This asset has unspecified data sensitivity.'} Classified as ${asset.sensitivity}.`;

  const upstreamNames = upstream.map((a) => a.name);
  const downstreamNames = downstream.map((a) => a.name);
  const dependencies = `${upstream.length > 0 ? `Upstream sources: ${upstreamNames.join(', ')}.` : 'No upstream sources — this is a root data origin.'} ${downstream.length > 0 ? `Downstream consumers: ${downstreamNames.join(', ')}.` : 'No downstream consumers — this is a terminal asset.'}`;

  const nextSteps: string[] = [];
  if (impact.criticalAffected > 0) {
    nextSteps.push(`Notify owners of ${impact.criticalAffected} critical downstream asset${impact.criticalAffected !== 1 ? 's' : ''} before any change.`);
  }
  if (asset.lifecycle === 'Legacy') {
    nextSteps.push('Prioritize this legacy asset for modernization planning — assess migration or redesign.');
  }
  if (asset.modernizationStatus === 'Remediate') {
    nextSteps.push('Schedule remediation work to address technical debt and improve data quality.');
  }
  if (asset.sensitivity === 'Restricted' || asset.sensitivity === 'Confidential') {
    nextSteps.push('Ensure access controls and audit logging are in place due to data sensitivity.');
  }
  nextSteps.push(`Coordinate with ${asset.team} to schedule a maintenance window.`);
  if (impact.totalAffected > 3) {
    nextSteps.push(`Given the large blast radius (${impact.totalAffected} assets), consider a phased rollout with validation gates.`);
  }
  nextSteps.push('Validate downstream consumers after the change is applied.');

  return { whatItIs, risk, sensitivity, dependencies, nextSteps };
}
