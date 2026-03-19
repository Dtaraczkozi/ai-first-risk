import type { Risk, RiskAssessment } from '@/types/risk';
import type { Control, ControlSuggestion } from '@/types/control';
import type { AgentTask, MonitoringAlert, RiskReport, ApprovalRequest } from '@/types/agent';

import { mockRisks } from './mock/risks';
import { mockControls, mockControlSuggestions } from './mock/controls';
import { mockAssessments, mockAlerts, mockReports, mockApprovalRequests } from './mock/assessments';

class DataStore {
  private risks: Map<string, Risk> = new Map();
  private controls: Map<string, Control> = new Map();
  private assessments: Map<string, RiskAssessment> = new Map();
  private controlSuggestions: Map<string, ControlSuggestion> = new Map();
  private alerts: Map<string, MonitoringAlert> = new Map();
  private reports: Map<string, RiskReport> = new Map();
  private approvalRequests: Map<string, ApprovalRequest> = new Map();
  private tasks: Map<string, AgentTask> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    mockRisks.forEach(risk => this.risks.set(risk.id, risk));
    mockControls.forEach(control => this.controls.set(control.id, control));
    mockAssessments.forEach(assessment => this.assessments.set(assessment.id, assessment));
    mockControlSuggestions.forEach(suggestion => this.controlSuggestions.set(suggestion.id, suggestion));
    mockAlerts.forEach(alert => this.alerts.set(alert.id, alert));
    mockReports.forEach(report => this.reports.set(report.id, report));
    mockApprovalRequests.forEach(request => this.approvalRequests.set(request.id, request));
  }

  // Risks
  getRisks(): Risk[] {
    return Array.from(this.risks.values());
  }

  getRisk(id: string): Risk | undefined {
    return this.risks.get(id);
  }

  createRisk(risk: Risk): Risk {
    this.risks.set(risk.id, risk);
    return risk;
  }

  updateRisk(id: string, updates: Partial<Risk>): Risk | undefined {
    const existing = this.risks.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.risks.set(id, updated);
    return updated;
  }

  deleteRisk(id: string): boolean {
    return this.risks.delete(id);
  }

  // Controls
  getControls(): Control[] {
    return Array.from(this.controls.values());
  }

  getControl(id: string): Control | undefined {
    return this.controls.get(id);
  }

  createControl(control: Control): Control {
    this.controls.set(control.id, control);
    return control;
  }

  updateControl(id: string, updates: Partial<Control>): Control | undefined {
    const existing = this.controls.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.controls.set(id, updated);
    return updated;
  }

  getControlsForRisk(riskId: string): Control[] {
    const risk = this.risks.get(riskId);
    if (!risk) return [];
    return risk.controlIds
      .map(id => this.controls.get(id))
      .filter((c): c is Control => c !== undefined);
  }

  // Assessments
  getAssessments(): RiskAssessment[] {
    return Array.from(this.assessments.values());
  }

  getAssessmentsForRisk(riskId: string): RiskAssessment[] {
    return Array.from(this.assessments.values()).filter(a => a.riskId === riskId);
  }

  createAssessment(assessment: RiskAssessment): RiskAssessment {
    this.assessments.set(assessment.id, assessment);
    return assessment;
  }

  // Control Suggestions
  getControlSuggestions(): ControlSuggestion[] {
    return Array.from(this.controlSuggestions.values());
  }

  getPendingControlSuggestions(): ControlSuggestion[] {
    return Array.from(this.controlSuggestions.values()).filter(s => s.approvalStatus === 'pending');
  }

  createControlSuggestion(suggestion: ControlSuggestion): ControlSuggestion {
    this.controlSuggestions.set(suggestion.id, suggestion);
    return suggestion;
  }

  updateControlSuggestion(id: string, updates: Partial<ControlSuggestion>): ControlSuggestion | undefined {
    const existing = this.controlSuggestions.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.controlSuggestions.set(id, updated);
    return updated;
  }

  // Alerts
  getAlerts(): MonitoringAlert[] {
    return Array.from(this.alerts.values());
  }

  getActiveAlerts(): MonitoringAlert[] {
    return Array.from(this.alerts.values()).filter(a => !a.acknowledgedAt);
  }

  createAlert(alert: MonitoringAlert): MonitoringAlert {
    this.alerts.set(alert.id, alert);
    return alert;
  }

  acknowledgeAlert(id: string): MonitoringAlert | undefined {
    const existing = this.alerts.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, acknowledgedAt: new Date() };
    this.alerts.set(id, updated);
    return updated;
  }

  // Reports
  getReports(): RiskReport[] {
    return Array.from(this.reports.values());
  }

  getReport(id: string): RiskReport | undefined {
    return this.reports.get(id);
  }

  createReport(report: RiskReport): RiskReport {
    this.reports.set(report.id, report);
    return report;
  }

  // Approval Requests
  getApprovalRequests(): ApprovalRequest[] {
    return Array.from(this.approvalRequests.values());
  }

  getPendingApprovalRequests(): ApprovalRequest[] {
    return Array.from(this.approvalRequests.values()).filter(r => r.status === 'pending');
  }

  getApprovalRequest(id: string): ApprovalRequest | undefined {
    return this.approvalRequests.get(id);
  }

  createApprovalRequest(request: ApprovalRequest): ApprovalRequest {
    this.approvalRequests.set(request.id, request);
    return request;
  }

  updateApprovalRequest(id: string, updates: Partial<ApprovalRequest>): ApprovalRequest | undefined {
    const existing = this.approvalRequests.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.approvalRequests.set(id, updated);
    return updated;
  }

  // Tasks
  getTasks(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  getTask(id: string): AgentTask | undefined {
    return this.tasks.get(id);
  }

  createTask(task: AgentTask): AgentTask {
    this.tasks.set(task.id, task);
    return task;
  }

  updateTask(id: string, updates: Partial<AgentTask>): AgentTask | undefined {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates } as AgentTask;
    this.tasks.set(id, updated);
    return updated;
  }

  // Statistics
  getStats() {
    const risks = this.getRisks();
    const controls = this.getControls();
    const pendingApprovals = this.getPendingApprovalRequests();
    const activeAlerts = this.getActiveAlerts();

    return {
      totalRisks: risks.length,
      risksByCategory: risks.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      risksByStatus: risks.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      risksBySeverity: risks.reduce((acc, r) => {
        acc[r.severity] = (acc[r.severity] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
      totalControls: controls.length,
      pendingApprovals: pendingApprovals.length,
      activeAlerts: activeAlerts.length,
    };
  }
}

export const dataStore = new DataStore();
