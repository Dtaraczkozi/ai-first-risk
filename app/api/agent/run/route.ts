import { NextRequest, NextResponse } from 'next/server';
import { agentOrchestrator } from '@/lib/agent/orchestrator';
import { registerAllTasks } from '@/lib/agent/tasks';
import type { AgentTaskType, AgentTaskInput } from '@/types/agent';

let tasksRegistered = false;

function ensureTasksRegistered() {
  if (!tasksRegistered) {
    registerAllTasks();
    tasksRegistered = true;
  }
}

export async function POST(request: NextRequest) {
  ensureTasksRegistered();
  
  try {
    const body = await request.json();
    const { type, input } = body as {
      type: AgentTaskType;
      input: AgentTaskInput[AgentTaskType];
    };
    
    if (!type) {
      return NextResponse.json(
        { error: 'Task type is required' },
        { status: 400 }
      );
    }
    
    const validTypes: AgentTaskType[] = ['identify', 'assess', 'suggest_controls', 'monitor', 'report'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid task type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    const task = await agentOrchestrator.createTask(type, input || {});
    
    return NextResponse.json({
      task: {
        id: task.id,
        type: task.type,
        status: task.status,
        createdAt: task.createdAt,
      },
      message: `Task ${task.id} created and queued for processing`,
    });
  } catch (error) {
    console.error('Error creating agent task:', error);
    return NextResponse.json(
      { error: 'Failed to create agent task' },
      { status: 500 }
    );
  }
}
