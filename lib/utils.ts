export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function getRiskScoreColor(score: number): string {
  if (score <= 15) return '#4caf50';
  if (score <= 45) return '#ff9800';
  if (score <= 75) return '#f44336';
  return '#9c27b0';
}

/** Colour for a 1–5 integer severity value (likelihood, impact, or rounded score). */
export function getSeverityColor(severity: number): string {
  const colors: Record<number, string> = {
    1: '#7ECDA0',
    2: '#2EB365',
    3: '#C29A1D',
    4: '#E54E54',
    5: '#C42B31',
  };
  return colors[severity] || '#9e9e9e';
}

/** Colour for a continuous score value (rounds to nearest integer band). */
export function getScoreColor(score: number): string {
  return getSeverityColor(Math.min(5, Math.max(1, Math.round(score))));
}

export function getSeverityLabel(severity: number): string {
  const labels: Record<number, string> = {
    1: 'Very Low',
    2: 'Low',
    3: 'Medium',
    4: 'High',
    5: 'Critical',
  };
  return labels[severity] || 'Unknown';
}

/** Human-readable label for a continuous 1–5 risk score (uses midpoint thresholds). */
export function getScoreLabel(score: number): string {
  if (score >= 4.5) return 'Very high';
  if (score >= 3.5) return 'High';
  if (score >= 2.5) return 'Medium';
  if (score >= 1.5) return 'Low';
  return 'Very low';
}

/** Canonical category → accent colour used across all pages. */
export const RISK_CATEGORY_COLORS: Record<string, string> = {
  operational: '#0060C7',
  compliance:  '#9530DC',
  financial:   '#009999',
  cyber:       '#C42B31',
  strategic:   '#C29A1D',
};

/** Canonical category → display label used across all pages. */
export const RISK_CATEGORY_LABELS: Record<string, string> = {
  operational: 'Operational',
  compliance:  'Compliance',
  financial:   'Financial',
  cyber:       'Cyber',
  strategic:   'Strategic',
};

/**
 * Returns a stable human-readable display ID (e.g. "RSK-1") for a risk
 * based on its position in the master risk list.
 */
export function getRiskDisplayId(riskId: string, allRisks: { id: string }[]): string {
  const idx = allRisks.findIndex(r => r.id === riskId);
  return idx >= 0 ? `RSK-${idx + 1}` : 'RSK-?';
}
