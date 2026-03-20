'use client';

import type { KeyRiskIndicator } from '@/types/kri';
import { deriveKRIStatus } from '@/types/kri';
import { MOCK_KRIS } from '@/data/mock/kris';

const STORAGE_KEY = 'kri_data';

// KRI id → category (used for auto-linking)
const KRI_CATEGORY_MAP: Record<string, string> = {
  'kri-001': 'cyber',
  'kri-002': 'cyber',
  'kri-003': 'compliance',
  'kri-004': 'compliance',
  'kri-005': 'operational',
  'kri-006': 'operational',
  'kri-007': 'financial',
  'kri-008': 'operational',
};

export function getKRIs(): KeyRiskIndicator[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    seedKRIs();
    return MOCK_KRIS;
  }
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((k: KeyRiskIndicator) => ({
      ...k,
      lastUpdatedAt: new Date(k.lastUpdatedAt),
      updatedByAgentAt: k.updatedByAgentAt ? new Date(k.updatedByAgentAt) : undefined,
      history: k.history.map((h) => ({ ...h, recordedAt: new Date(h.recordedAt) })),
    }));
  } catch {
    return MOCK_KRIS;
  }
}

export function seedKRIs(): void {
  if (typeof window === 'undefined') return;
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_KRIS));
  }
}

export function saveKRIs(kris: KeyRiskIndicator[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kris));
}

export function addKRI(kri: KeyRiskIndicator): void {
  if (typeof window === 'undefined') return;
  const kris = getKRIs();
  kris.push(kri);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kris));
}

export function updateKRI(id: string, updates: Partial<KeyRiskIndicator>): void {
  if (typeof window === 'undefined') return;
  const kris = getKRIs().map((k) => (k.id === id ? { ...k, ...updates } : k));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kris));
}

export function updateKRIValue(id: string, newValue: number): void {
  if (typeof window === 'undefined') return;
  const kris = getKRIs().map((k) => {
    if (k.id !== id) return k;
    const updated = {
      ...k,
      currentValue: newValue,
      lastUpdatedAt: new Date(),
      history: [...k.history, { value: newValue, recordedAt: new Date() }],
    };
    updated.status = deriveKRIStatus(updated);
    return updated;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kris));
}

export function linkKRIToRisk(kriId: string, riskId: string): void {
  if (typeof window === 'undefined') return;
  const kris = getKRIs().map((k) => {
    if (k.id !== kriId || k.linkedRiskIds.includes(riskId)) return k;
    return { ...k, linkedRiskIds: [...k.linkedRiskIds, riskId] };
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kris));
}

export function unlinkKRIFromRisk(kriId: string, riskId: string): void {
  if (typeof window === 'undefined') return;
  const kris = getKRIs().map((k) => {
    if (k.id !== kriId) return k;
    return { ...k, linkedRiskIds: k.linkedRiskIds.filter((rid) => rid !== riskId) };
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kris));
}

export function getKRIsByRiskId(riskId: string): KeyRiskIndicator[] {
  return getKRIs().filter((k) => k.linkedRiskIds.includes(riskId));
}

export function getKRIsByCategory(category: string): KeyRiskIndicator[] {
  return getKRIs().filter((k) => k.category === category);
}

export function getKRIStatusSummary(): { red: number; amber: number; green: number } {
  const kris = getKRIs();
  return {
    red: kris.filter((k) => k.status === 'red').length,
    amber: kris.filter((k) => k.status === 'amber').length,
    green: kris.filter((k) => k.status === 'green').length,
  };
}

/**
 * Auto-links KRIs to risks by category when linkedRiskIds are empty.
 * Deterministically assigns 3-4 risks per KRI based on category.
 * Only runs when KRIs have no existing links (first-time or after reset).
 */
export function ensureKRIRiskLinks(risks: Array<{ id: string; category: string }>): void {
  if (typeof window === 'undefined') return;
  const kris = getKRIs();
  const needsLinking = kris.some((k) => k.linkedRiskIds.length === 0);
  if (!needsLinking) return;

  const risksByCategory: Record<string, string[]> = {};
  risks.forEach((r) => {
    if (!risksByCategory[r.category]) risksByCategory[r.category] = [];
    risksByCategory[r.category].push(r.id);
  });

  const updatedKRIs = kris.map((kri) => {
    if (kri.linkedRiskIds.length > 0) return kri;
    const cat = KRI_CATEGORY_MAP[kri.id] ?? kri.category;
    const catRisks = risksByCategory[cat] ?? [];
    const linkedRiskIds = catRisks.slice(0, 4);
    return { ...kri, linkedRiskIds };
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedKRIs));
}
