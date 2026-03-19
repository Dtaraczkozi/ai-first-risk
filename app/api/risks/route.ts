import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/data/store';
import type { Risk } from '@/types/risk';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  
  let risks = dataStore.getRisks();
  
  if (category && category !== 'all') {
    risks = risks.filter(r => r.category === category);
  }
  
  if (status && status !== 'all') {
    risks = risks.filter(r => r.status === status);
  }
  
  return NextResponse.json({ risks });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newRisk: Risk = {
      id: `risk-${Date.now()}`,
      title: body.title,
      description: body.description,
      category: body.category,
      severity: body.severity,
      likelihood: body.likelihood,
      impact: body.impact,
      status: body.status || 'identified',
      controlIds: body.controlIds || [],
      createdBy: body.createdBy || 'user',
      approvalStatus: body.approvalStatus || 'approved',
      owner: body.owner,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const created = dataStore.createRisk(newRisk);
    return NextResponse.json({ risk: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create risk' },
      { status: 400 }
    );
  }
}
