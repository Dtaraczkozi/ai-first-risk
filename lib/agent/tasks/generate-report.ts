import type { AgentTask, RiskReport } from '@/types/agent';
import { sendStructuredMessage } from '@/lib/anthropic';
import { SYSTEM_PROMPTS, USER_PROMPTS } from '../prompts';
import { dataStore } from '@/data/store';

interface ReportInput {
  reportType: 'summary' | 'detailed' | 'executive';
  riskIds?: string[];
}

interface ReportResponse {
  report: {
    title: string;
    type: 'summary' | 'detailed' | 'executive';
    content: string;
    risksSummary: {
      total: number;
      byCategory: Record<string, number>;
      bySeverity: Record<string, number>;
      byStatus: Record<string, number>;
    };
    recommendations: string[];
  };
}

export async function generateReportTask(
  task: AgentTask
): Promise<{
  output: unknown;
  approvalData?: {
    title: string;
    description: string;
    proposedChanges: Record<string, unknown>;
    reasoning: string;
    evidence?: string[];
  };
}> {
  const input = task.input as ReportInput;
  
  let risks = dataStore.getRisks();
  if (input.riskIds && input.riskIds.length > 0) {
    risks = risks.filter(r => input.riskIds!.includes(r.id));
  }

  const controls = dataStore.getControls();

  const response = await sendStructuredMessage<ReportResponse>(
    SYSTEM_PROMPTS.report,
    USER_PROMPTS.report({
      reportType: input.reportType,
      risks: risks.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        severity: r.severity,
        likelihood: r.likelihood,
        impact: r.impact,
        status: r.status,
        controlCount: r.controlIds.length,
      })),
      controls: controls.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        effectiveness: c.effectiveness,
      })),
    }),
    { temperature: 0.5, maxTokens: 8192 }
  );

  const report: RiskReport = {
    id: `report-${Date.now()}`,
    title: response.report.title,
    type: response.report.type,
    content: response.report.content,
    risksSummary: {
      total: response.report.risksSummary.total,
      byCategory: response.report.risksSummary.byCategory,
      bySeverity: Object.fromEntries(
        Object.entries(response.report.risksSummary.bySeverity).map(([k, v]) => [parseInt(k), v])
      ),
      byStatus: response.report.risksSummary.byStatus,
    },
    recommendations: response.report.recommendations,
    generatedAt: new Date(),
  };

  dataStore.createReport(report);

  const output = { report };

  return {
    output,
    approvalData: {
      title: `Publish: ${report.title}`,
      description: `AI agent has generated a ${input.reportType} risk report for stakeholder distribution.`,
      proposedChanges: {
        action: 'publish_report',
        reportId: report.id,
        reportType: input.reportType,
      },
      reasoning: 'Report generated based on current risk portfolio and control effectiveness data.',
      evidence: response.report.recommendations.slice(0, 3),
    },
  };
}
