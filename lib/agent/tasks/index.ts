import { agentOrchestrator } from '../orchestrator';
import { identifyRisksTask } from './identify-risks';
import { assessRiskTask } from './assess-risk';
import { suggestControlsTask } from './suggest-controls';
import { monitorTask } from './monitor';
import { generateReportTask } from './generate-report';

export function registerAllTasks(): void {
  agentOrchestrator.registerHandler('identify', identifyRisksTask);
  agentOrchestrator.registerHandler('assess', assessRiskTask);
  agentOrchestrator.registerHandler('suggest_controls', suggestControlsTask);
  agentOrchestrator.registerHandler('monitor', monitorTask);
  agentOrchestrator.registerHandler('report', generateReportTask);
}

export {
  identifyRisksTask,
  assessRiskTask,
  suggestControlsTask,
  monitorTask,
  generateReportTask,
};
