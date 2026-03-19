import { NextResponse } from 'next/server';
import { agentOrchestrator } from '@/lib/agent/orchestrator';
import { dataStore } from '@/data/store';

export async function GET() {
  const taskStats = agentOrchestrator.getStats();
  const activeTasks = agentOrchestrator.getActiveTasks();
  const pendingApprovals = dataStore.getPendingApprovalRequests();
  const activeAlerts = dataStore.getActiveAlerts();
  
  return NextResponse.json({
    agent: {
      status: taskStats.running > 0 ? 'processing' : taskStats.queued > 0 ? 'queued' : 'idle',
      tasks: taskStats,
      activeTasks: activeTasks.map(t => ({
        id: t.id,
        type: t.type,
        status: t.status,
        createdAt: t.createdAt,
        startedAt: t.startedAt,
      })),
    },
    approvals: {
      pending: pendingApprovals.length,
      items: pendingApprovals.slice(0, 5).map(a => ({
        id: a.id,
        taskType: a.taskType,
        title: a.title,
        createdAt: a.createdAt,
      })),
    },
    alerts: {
      active: activeAlerts.length,
      critical: activeAlerts.filter(a => a.severity === 'critical').length,
    },
    stats: dataStore.getStats(),
  });
}
