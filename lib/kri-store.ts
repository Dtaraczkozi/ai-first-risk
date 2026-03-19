'use client';

import type { KeyRiskIndicator } from '@/types/kri';
import { MOCK_KRIS } from '@/data/mock/kris';

const STORAGE_KEY = 'kri_data';

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

export function getKRIsByRiskId(riskId: string): KeyRiskIndicator[] {
  return getKRIs().filter((k) => k.linkedRiskIds.includes(riskId));
}

export function getKRIStatusSummary(): { red: number; amber: number; green: number } {
  const kris = getKRIs();
  return {
    red: kris.filter((k) => k.status === 'red').length,
    amber: kris.filter((k) => k.status === 'amber').length,
    green: kris.filter((k) => k.status === 'green').length,
  };
}
