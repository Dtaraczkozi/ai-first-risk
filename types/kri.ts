export type KRIStatus = 'green' | 'amber' | 'red';
export type KRITrend = 'improving' | 'stable' | 'worsening';

export interface KRIThreshold {
  greenMax: number;
  amberMax: number;
  unit: string;
  direction: 'lower_is_better' | 'higher_is_better';
}

export interface KRIDataPoint {
  value: number;
  recordedAt: Date;
}

export interface KeyRiskIndicator {
  id: string;
  name: string;
  description: string;
  category: 'operational' | 'compliance' | 'financial' | 'cyber' | 'strategic';
  currentValue: number;
  threshold: KRIThreshold;
  status: KRIStatus;
  trend: KRITrend;
  history: KRIDataPoint[];
  linkedRiskIds: string[];
  owner: string;
  lastUpdatedAt: Date;
  updatedByAgentAt?: Date;
  agentNote?: string;
  agentGenerated: boolean;
}

export function deriveKRIStatus(kri: Pick<KeyRiskIndicator, 'currentValue' | 'threshold'>): KRIStatus {
  const { currentValue, threshold } = kri;
  if (threshold.direction === 'lower_is_better') {
    if (currentValue <= threshold.greenMax) return 'green';
    if (currentValue <= threshold.amberMax) return 'amber';
    return 'red';
  } else {
    if (currentValue >= threshold.greenMax) return 'green';
    if (currentValue >= threshold.amberMax) return 'amber';
    return 'red';
  }
}
