import { NextRequest, NextResponse } from 'next/server';
import { processApprovalDecision } from '@/lib/agent/approval-gate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, decision, reviewedBy, feedback } = body;
    
    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }
    
    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { error: 'Decision must be "approved" or "rejected"' },
        { status: 400 }
      );
    }
    
    const result = processApprovalDecision(
      requestId,
      decision,
      reviewedBy || 'user',
      feedback
    );
    
    if (!result) {
      return NextResponse.json(
        { error: 'Approval request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      approval: result,
      message: `Request ${requestId} has been ${decision}`,
    });
  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}
