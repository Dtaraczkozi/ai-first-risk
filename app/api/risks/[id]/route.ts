import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/data/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const risk = dataStore.getRisk(id);
  
  if (!risk) {
    return NextResponse.json(
      { error: 'Risk not found' },
      { status: 404 }
    );
  }
  
  const controls = dataStore.getControlsForRisk(id);
  const assessments = dataStore.getAssessmentsForRisk(id);
  
  return NextResponse.json({ risk, controls, assessments });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const updated = dataStore.updateRisk(id, body);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Risk not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ risk: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update risk' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = dataStore.deleteRisk(id);
  
  if (!deleted) {
    return NextResponse.json(
      { error: 'Risk not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ success: true });
}
