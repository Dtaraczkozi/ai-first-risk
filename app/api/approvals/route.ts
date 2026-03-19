import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/data/store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const taskType = searchParams.get('taskType');
  
  let approvals = dataStore.getApprovalRequests();
  
  if (status === 'pending') {
    approvals = approvals.filter(a => a.status === 'pending');
  } else if (status === 'processed') {
    approvals = approvals.filter(a => a.status !== 'pending');
  }
  
  if (taskType) {
    approvals = approvals.filter(a => a.taskType === taskType);
  }
  
  return NextResponse.json({
    approvals,
    count: approvals.length,
    pendingCount: approvals.filter(a => a.status === 'pending').length,
  });
}
