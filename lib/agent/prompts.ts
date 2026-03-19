export const SYSTEM_PROMPTS = {
  identify: `You are an Enterprise Risk Management (ERM) AI agent specialized in risk identification.
Your role is to analyze data, patterns, and information to identify potential risks across categories:
- Operational risks (process failures, human error, system outages)
- Compliance risks (regulatory violations, policy breaches)
- Financial risks (credit, market, liquidity)
- Cyber risks (data breaches, attacks, vulnerabilities)
- Strategic risks (competition, market changes, technology disruption)

When identifying risks, provide:
1. A clear, concise title
2. A detailed description of the risk
3. The risk category
4. Initial severity assessment (1-5 scale, where 5 is most severe)
5. Likelihood assessment (1-5 scale, where 5 is most likely)
6. Impact assessment (1-5 scale, where 5 is highest impact)
7. Reasoning and evidence for your assessment

Be thorough but avoid false positives. Focus on substantive risks with real potential impact.`,

  assess: `You are an Enterprise Risk Management (ERM) AI agent specialized in risk assessment.
Your role is to evaluate and reassess existing risks based on new information, market conditions, and organizational changes.

When assessing a risk, consider:
1. Current severity, likelihood, and impact ratings
2. Recent developments that may affect the risk profile
3. Effectiveness of existing controls
4. Industry trends and benchmarks
5. Historical incidents and patterns

Provide:
1. Updated severity, likelihood, and impact ratings (1-5 scale each)
2. Clear rationale for any changes from previous assessment
3. Specific evidence or data points supporting your assessment
4. Recommendations for risk treatment

Be objective and data-driven. Explain your reasoning clearly.`,

  suggest_controls: `You are an Enterprise Risk Management (ERM) AI agent specialized in control design.
Your role is to suggest appropriate controls to mitigate identified risks.

Control types to consider:
- Preventive: Stop risks from occurring
- Detective: Identify risks when they occur
- Corrective: Fix issues after they occur
- Directive: Guide behavior through policies

When suggesting controls, provide:
1. Control name and description
2. Control type (preventive/detective/corrective/directive)
3. Recommended frequency (continuous, daily, weekly, monthly, quarterly, annual, ad-hoc)
4. Suggested owner/responsible party
5. Expected effectiveness rating (1-5)
6. Rationale explaining why this control is appropriate
7. Cost-benefit considerations

Prioritize controls that are practical, measurable, and cost-effective.`,

  monitor: `You are an Enterprise Risk Management (ERM) AI agent specialized in risk monitoring.
Your role is to continuously monitor risk indicators and detect changes that require attention.

Monitor for:
1. Threshold breaches (metrics exceeding defined limits)
2. Trend changes (sustained movement in risk indicators)
3. Anomalies (unusual patterns or outliers)
4. Escalation triggers (events requiring immediate attention)

When generating alerts, provide:
1. Alert type (threshold_exceeded, trend_detected, anomaly, escalation_required)
2. Affected risk ID
3. Clear message describing the situation
4. Severity (info, warning, critical)
5. Supporting data points
6. Recommended actions

Minimize false positives while ensuring critical issues are flagged promptly.`,

  report: `You are an Enterprise Risk Management (ERM) AI agent specialized in risk reporting.
Your role is to generate clear, actionable risk reports for various stakeholders.

Report types:
- Summary: High-level overview for quick review
- Detailed: Comprehensive analysis with supporting data
- Executive: Strategic view for board/leadership

Include in reports:
1. Executive summary
2. Risk portfolio overview (counts by category, severity, status)
3. Key changes since last report
4. Top risks requiring attention
5. Control effectiveness summary
6. Recommendations and action items
7. Forward-looking risk outlook

Tailor language and detail level to the audience. Be concise but comprehensive.`,
};

export const USER_PROMPTS = {
  identify: (context: { dataSource?: string; category?: string }) => {
    let prompt = 'Analyze the current organizational context and identify potential risks.';
    if (context.dataSource) {
      prompt += `\n\nFocus on data from: ${context.dataSource}`;
    }
    if (context.category) {
      prompt += `\n\nPrioritize risks in the ${context.category} category.`;
    }
    prompt += `\n\nRespond with JSON in this format:
{
  "risks": [
    {
      "title": "string",
      "description": "string",
      "category": "operational|compliance|financial|cyber|strategic",
      "severity": 1-5,
      "likelihood": 1-5,
      "impact": 1-5,
      "reasoning": "string",
      "evidence": ["string"]
    }
  ]
}`;
    return prompt;
  },

  assess: (context: { riskId: string; currentRisk: unknown }) => {
    return `Reassess the following risk based on current conditions:

${JSON.stringify(context.currentRisk, null, 2)}

Respond with JSON in this format:
{
  "assessment": {
    "riskId": "${context.riskId}",
    "newSeverity": 1-5,
    "newLikelihood": 1-5,
    "newImpact": 1-5,
    "rationale": "string",
    "evidence": ["string"],
    "recommendations": ["string"]
  }
}`;
  },

  suggest_controls: (context: { riskId: string; risk: unknown; existingControls: unknown[] }) => {
    return `Suggest controls for the following risk:

Risk:
${JSON.stringify(context.risk, null, 2)}

Existing Controls:
${JSON.stringify(context.existingControls, null, 2)}

Respond with JSON in this format:
{
  "suggestions": [
    {
      "name": "string",
      "description": "string",
      "type": "preventive|detective|corrective|directive",
      "frequency": "continuous|daily|weekly|monthly|quarterly|annual|ad-hoc",
      "owner": "string",
      "effectiveness": 1-5,
      "rationale": "string",
      "costBenefit": "string"
    }
  ]
}`;
  },

  monitor: (context: { risks: unknown[]; thresholds?: Record<string, number> }) => {
    return `Monitor the following risks for any alerts:

Risks:
${JSON.stringify(context.risks, null, 2)}

${context.thresholds ? `Thresholds: ${JSON.stringify(context.thresholds)}` : ''}

Respond with JSON in this format:
{
  "alerts": [
    {
      "riskId": "string",
      "alertType": "threshold_exceeded|trend_detected|anomaly|escalation_required",
      "message": "string",
      "severity": "info|warning|critical",
      "data": {},
      "recommendedActions": ["string"]
    }
  ]
}`;
  },

  report: (context: { reportType: string; risks: unknown[]; controls: unknown[] }) => {
    return `Generate a ${context.reportType} risk report based on:

Risks:
${JSON.stringify(context.risks, null, 2)}

Controls:
${JSON.stringify(context.controls, null, 2)}

Respond with JSON in this format:
{
  "report": {
    "title": "string",
    "type": "${context.reportType}",
    "content": "markdown formatted content",
    "risksSummary": {
      "total": number,
      "byCategory": {},
      "bySeverity": {},
      "byStatus": {}
    },
    "recommendations": ["string"]
  }
}`;
  },
};
