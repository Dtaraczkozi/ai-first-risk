import type { AgentTask, AgentTaskType, AgentTaskInput, AgentTaskStatus } from '@/types/agent';
import { dataStore } from '@/data/store';
import { requiresApproval, createApprovalRequest } from './approval-gate';

type TaskHandler = (
  task: AgentTask
) => Promise<{
  output: unknown;
  approvalData?: {
    title: string;
    description: string;
    proposedChanges: Record<string, unknown>;
    reasoning: string;
    evidence?: string[];
  };
}>;

class AgentOrchestrator {
  private taskHandlers: Map<AgentTaskType, TaskHandler> = new Map();
  private isProcessing = false;

  registerHandler(type: AgentTaskType, handler: TaskHandler): void {
    this.taskHandlers.set(type, handler);
  }

  async createTask<T extends AgentTaskType>(
    type: T,
    input: AgentTaskInput[T]
  ): Promise<AgentTask<T>> {
    const task: AgentTask<T> = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: 'queued',
      input,
      requiresApproval: requiresApproval(type),
      approvalDecision: 'pending',
      createdAt: new Date(),
    };

    dataStore.createTask(task as AgentTask);
    this.processQueue();
    
    return task;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const tasks = dataStore.getTasks().filter(t => t.status === 'queued');
      
      for (const task of tasks) {
        await this.executeTask(task);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeTask(task: AgentTask): Promise<void> {
    const handler = this.taskHandlers.get(task.type);
    
    if (!handler) {
      dataStore.updateTask(task.id, {
        status: 'failed',
        error: `No handler registered for task type: ${task.type}`,
        completedAt: new Date(),
      });
      return;
    }

    dataStore.updateTask(task.id, {
      status: 'running',
      startedAt: new Date(),
    });

    try {
      const result = await handler(task);

      if (task.requiresApproval && result.approvalData) {
        dataStore.updateTask(task.id, {
          status: 'awaiting_approval',
          output: result.output as AgentTask['output'],
        });

        createApprovalRequest(
          task,
          result.approvalData.title,
          result.approvalData.description,
          result.approvalData.proposedChanges,
          result.approvalData.reasoning,
          result.approvalData.evidence
        );
      } else {
        dataStore.updateTask(task.id, {
          status: 'completed',
          output: result.output as AgentTask['output'],
          completedAt: new Date(),
        });
      }
    } catch (error) {
      dataStore.updateTask(task.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      });
    }
  }

  getTaskStatus(taskId: string): AgentTaskStatus | undefined {
    return dataStore.getTask(taskId)?.status;
  }

  getActiveTasks(): AgentTask[] {
    return dataStore.getTasks().filter(
      t => t.status === 'queued' || t.status === 'running' || t.status === 'awaiting_approval'
    );
  }

  getTasksByType(type: AgentTaskType): AgentTask[] {
    return dataStore.getTasks().filter(t => t.type === type);
  }

  getStats() {
    const tasks = dataStore.getTasks();
    return {
      total: tasks.length,
      queued: tasks.filter(t => t.status === 'queued').length,
      running: tasks.filter(t => t.status === 'running').length,
      awaitingApproval: tasks.filter(t => t.status === 'awaiting_approval').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
    };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
