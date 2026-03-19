'use client';

import type { AIAssessorPersona } from '@/types/assessor-persona';
import { MOCK_PERSONAS } from '@/data/mock/personas';

const STORAGE_KEY = 'assessor_personas';

export function getPersonas(): AIAssessorPersona[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    seedPersonas();
    return MOCK_PERSONAS;
  }
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((p: AIAssessorPersona) => ({
      ...p,
      createdAt: new Date(p.createdAt),
    }));
  } catch {
    return MOCK_PERSONAS;
  }
}

export function seedPersonas(): void {
  if (typeof window === 'undefined') return;
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PERSONAS));
  }
}

export function addPersona(persona: AIAssessorPersona): void {
  if (typeof window === 'undefined') return;
  const personas = getPersonas();
  personas.push(persona);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(personas));
}

export function updatePersona(id: string, updates: Partial<AIAssessorPersona>): void {
  if (typeof window === 'undefined') return;
  const personas = getPersonas().map((p) => (p.id === id ? { ...p, ...updates } : p));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(personas));
}

export function getActivePersonas(): AIAssessorPersona[] {
  return getPersonas().filter((p) => p.active);
}
