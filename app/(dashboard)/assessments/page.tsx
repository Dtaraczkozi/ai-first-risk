'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Avatar,
  AvatarGroup,
  Grid,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  Warning as SeverityIcon,
  Business as DepartmentIcon,
  PlayArrow as StartIcon,
  PriorityHigh as PriorityIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  AccessTime as ClockIcon,
  ArrowForward as ArrowIcon,
  ErrorOutline as OverdueIcon,
  DonutLarge as ProgressIcon,
  AutoAwesome as SparkleIcon,
  Gavel as RegulationIcon,
  Article as NewsIcon,
  Loop as PeriodicIcon,
  Shield as ShieldIcon,
  FiberManualRecord as DotIcon,
  OpenInNew as OpenInNewIcon,
  Engineering as OperationalIcon,
  VerifiedUser as ComplianceIcon,
  AccountBalance as FinancialIcon,
  Security as CyberIcon,
  Explore as StrategicIcon,
} from '@mui/icons-material';
import type { RiskSuggestion } from '@/types/document';
import { getApprovedRisks } from '@/lib/risk-store';
import { AssessmentDetailPanel, type AssessmentGroup } from '@/components/assessment/AssessmentDetailDrawer';

type GroupBy = 'category' | 'owner' | 'severity' | 'department';

// Category colors used only for severity-like differentiation (small indicators only)
const categoryColors: Record<string, string> = {
  operational: '#0060C7',
  compliance: '#9530DC',
  financial: '#009999',
  cyber: '#C42B31',
  strategic: '#C29A1D',
};

// Icons for group cards — differentiates types without relying on color
const categoryIconMap: Record<string, React.ElementType> = {
  operational: OperationalIcon,
  compliance: ComplianceIcon,
  financial: FinancialIcon,
  cyber: CyberIcon,
  strategic: StrategicIcon,
};

const severityLabels: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very High',
};

const severityColors: Record<number, string> = {
  1: '#4caf50',
  2: '#8bc34a',
  3: '#ff9800',
  4: '#f44336',
  5: '#b71c1c',
};

const ownerColors: Record<string, string> = {
  'Sarah Chen': '#0060C7',
  'Michael Torres': '#C42B31',
  'Jennifer Walsh': '#9530DC',
  'David Park': '#009999',
  'Robert Kim': '#C29A1D',
};

export default function AssessmentsPage() {
  const [risks, setRisks] = useState<RiskSuggestion[]>([]);
  const [groupBy, setGroupBy] = useState<GroupBy>('category');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [detailGroup, setDetailGroup] = useState<AssessmentGroup | null>(null);
  const [existingFilter, setExistingFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const assessmentGroupsRef = useRef<HTMLDivElement>(null);

  const getGroupIcon = (group: AssessmentGroup): React.ElementType => {
    if (group.id.startsWith('cat-')) return categoryIconMap[group.id.replace('cat-', '')] || CategoryIcon;
    if (group.id.startsWith('owner-')) return PersonIcon;
    if (group.id.startsWith('sev-')) return SeverityIcon;
    if (group.id.startsWith('dept-')) return DepartmentIcon;
    return CategoryIcon;
  };

  useEffect(() => {
    const approvedRisks = getApprovedRisks();
    setRisks(approvedRisks);
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleGroupByChange = (_: React.MouseEvent<HTMLElement>, newGroupBy: GroupBy | null) => {
    if (newGroupBy) {
      setGroupBy(newGroupBy);
      setExpandedGroup(null);
    }
  };

  const groupRisks = (): AssessmentGroup[] => {
    if (risks.length === 0) return [];

    switch (groupBy) {
      case 'category':
        const categoryGroups: Record<string, RiskSuggestion[]> = {};
        risks.forEach(risk => {
          const cat = risk.category || 'other';
          if (!categoryGroups[cat]) categoryGroups[cat] = [];
          categoryGroups[cat].push(risk);
        });
        return Object.entries(categoryGroups).map(([cat, catRisks]) => ({
          id: `cat-${cat}`,
          label: cat.charAt(0).toUpperCase() + cat.slice(1) + ' Risks',
          description: `Assessment for all ${cat} risks in your organization`,
          risks: catRisks,
          color: categoryColors[cat],
        }));

      case 'owner':
        const ownerGroups: Record<string, RiskSuggestion[]> = {};
        risks.forEach(risk => {
          const owner = risk.suggestedOwner?.name || 'Unassigned';
          if (!ownerGroups[owner]) ownerGroups[owner] = [];
          ownerGroups[owner].push(risk);
        });
        return Object.entries(ownerGroups).map(([owner, ownerRisks]) => ({
          id: `owner-${owner}`,
          label: owner === 'Unassigned' ? 'Unassigned Risks' : `${owner}'s Risks`,
          description: owner === 'Unassigned' 
            ? 'Risks that need an owner assigned'
            : `Assessment for risks owned by ${owner}`,
          risks: ownerRisks,
          color: ownerColors[owner] || '#6B7280',
        }));

      case 'severity':
        const severityGroups: Record<number, RiskSuggestion[]> = {};
        risks.forEach(risk => {
          const score = Math.round((risk.likelihood + risk.impact) / 2);
          if (!severityGroups[score]) severityGroups[score] = [];
          severityGroups[score].push(risk);
        });
        return Object.entries(severityGroups)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([score, sevRisks]) => ({
            id: `sev-${score}`,
            label: `${severityLabels[Number(score)]} Severity Risks`,
            description: `Assessment for risks with ${severityLabels[Number(score)].toLowerCase()} severity rating`,
            risks: sevRisks,
            color: severityColors[Number(score)],
          }));

      case 'department':
        const deptGroups: Record<string, RiskSuggestion[]> = {};
        risks.forEach(risk => {
          const dept = risk.suggestedOwner?.department || 'Unassigned';
          if (!deptGroups[dept]) deptGroups[dept] = [];
          deptGroups[dept].push(risk);
        });
        return Object.entries(deptGroups).map(([dept, deptRisks]) => ({
          id: `dept-${dept}`,
          label: dept === 'Unassigned' ? 'Unassigned Department' : dept,
          description: dept === 'Unassigned'
            ? 'Risks that need department assignment'
            : `Assessment for all risks in ${dept}`,
          risks: deptRisks,
        }));

      default:
        return [];
    }
  };

  const assessmentGroups = groupRisks();

  // Derive "existing assessments" from risks that are in_progress or assessed
  const existingAssessmentGroups = useMemo(() => {
    const groups: Record<string, RiskSuggestion[]> = {};
    risks.forEach(r => {
      if (r.assessmentStatus === 'in_progress' || r.assessmentStatus === 'assessed') {
        const cat = r.category || 'other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(r);
      }
    });

    return Object.entries(groups).map(([cat, catRisks]) => {
      const assessed = catRisks.filter(r => r.assessmentStatus === 'assessed').length;
      const inProgress = catRisks.filter(r => r.assessmentStatus === 'in_progress').length;
      const total = catRisks.length;
      const progress = Math.round((assessed / total) * 100);
      const highSevCount = catRisks.filter(r => Math.round((r.likelihood + r.impact) / 2) >= 4).length;
      const uniqueAssessors = [...new Map(
        catRisks.filter(r => r.suggestedOwner).map(r => [r.suggestedOwner!.name, r.suggestedOwner!])
      ).values()];
      const oldestDate = new Date(Math.min(...catRisks.map(r => new Date(r.createdAt).getTime())));
      const daysSinceStart = Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
      const isCompleted = assessed === total && total > 0;
      const isOverdue = !isCompleted && daysSinceStart > 14;

      return {
        id: cat,
        category: cat as RiskSuggestion['category'],
        label: cat.charAt(0).toUpperCase() + cat.slice(1) + ' Risk Assessment',
        description: `Assessing ${total} ${cat} risk${total !== 1 ? 's' : ''} across the organization`,
        color: categoryColors[cat] || '#6B7280',
        risks: catRisks,
        assessed,
        inProgress,
        total,
        progress,
        highSevCount,
        assessors: uniqueAssessors,
        startedAt: oldestDate,
        daysSinceStart,
        isCompleted,
        isOverdue,
      };
    }).sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return b.highSevCount - a.highSevCount;
    });
  }, [risks]);

  const getScoreLabel = (risk: RiskSuggestion) => {
    const score = Math.round((risk.likelihood + risk.impact) / 2);
    return `${score} - ${severityLabels[score]}`;
  };

  const getScoreColor = (risk: RiskSuggestion) => {
    const score = Math.round((risk.likelihood + risk.impact) / 2);
    return severityColors[score];
  };

  const highPriorityRisks = risks.filter(r => {
    const score = Math.round((r.likelihood + r.impact) / 2);
    return score >= 4;
  });

  const categoryDistribution = risks.reduce((acc, risk) => {
    const cat = risk.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalCategories = Object.keys(categoryDistribution).length;

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
      {/* ── Main content column ── */}
      <Box sx={{ flex: 1, minWidth: 0, pr: detailGroup ? 3 : 0, transition: 'padding-right 0.2s ease' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Assessments
          </Typography>
        </Box>
      </Stack>

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ 
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none' },
        }}
      >
        <Tab label="Assessment suggestions" />
        <Tab label="Existing assessments" />
      </Tabs>

      {activeTab === 0 && (
        risks.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
              No approved risks yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approve risks from the Risk Discovery page to see assessment suggestions here.
            </Typography>
          </Paper>
        ) : (() => {
          const unassessedRisks = risks.filter(r => !r.assessmentStatus || r.assessmentStatus === 'unassessed');
          const inProgressRisks = risks.filter(r => r.assessmentStatus === 'in_progress');
          const assessedRisks = risks.filter(r => r.assessmentStatus === 'assessed');
          const highSevUnassessed = unassessedRisks.filter(r => Math.round((r.likelihood + r.impact) / 2) >= 4);
          const coveragePct = risks.length > 0 ? Math.round((assessedRisks.length / risks.length) * 100) : 0;

          // Category with most unassessed risks
          const unassessedByCategory = unassessedRisks.reduce<Record<string, number>>((acc, r) => {
            acc[r.category] = (acc[r.category] || 0) + 1; return acc;
          }, {});
          const topUnassessedCat = Object.entries(unassessedByCategory).sort(([,a],[,b]) => b - a)[0];

          // External trigger catalogue — filtered by categories present in the register
          const presentCategories = new Set(risks.map(r => r.category));
          interface Recommendation {
            id: string;
            type: 'priority' | 'regulation' | 'news' | 'periodic';
            urgency: 'critical' | 'high' | 'medium';
            headline: string;
            reasoning: string;
            source: string;
            affectedCategory?: string;
            affectedCount?: number;
          }

          const recommendations: Recommendation[] = [];

          // 1 — Priority-driven (always, if any high-sev unassessed)
          if (highSevUnassessed.length > 0) {
            recommendations.push({
              id: 'prio-high',
              type: 'priority',
              urgency: highSevUnassessed.length >= 5 ? 'critical' : 'high',
              headline: `${highSevUnassessed.length} high-severity risks unassessed`,
              reasoning: `Your register contains ${highSevUnassessed.length} risks rated high or critical with no assessment started. Assessing these first reduces your greatest areas of exposure and is required under most risk frameworks before treatment can begin.`,
              source: 'Risk register analysis',
              affectedCount: highSevUnassessed.length,
            });
          }

          // 2 — Top unassessed category
          if (topUnassessedCat) {
            recommendations.push({
              id: 'top-cat',
              type: 'priority',
              urgency: 'high',
              headline: `${topUnassessedCat[0].charAt(0).toUpperCase() + topUnassessedCat[0].slice(1)} risks have the most gaps`,
              reasoning: `${topUnassessedCat[1]} of your ${topUnassessedCat[0]} risks are currently unassessed — more than any other category. Completing this assessment would deliver the biggest single improvement to your overall coverage.`,
              source: 'Risk register analysis',
              affectedCategory: topUnassessedCat[0],
              affectedCount: topUnassessedCat[1],
            });
          }

          // 3 — Regulation triggers
          if (presentCategories.has('compliance')) {
            recommendations.push({
              id: 'reg-dora',
              type: 'regulation',
              urgency: 'high',
              headline: 'DORA operational resilience requirements',
              reasoning: 'The EU Digital Operational Resilience Act (DORA) entered full enforcement in January 2025. Financial entities must demonstrate ICT risk assessments are up to date. Any compliance or operational risks related to third-party ICT providers should be formally assessed and documented.',
              source: 'EU Regulation 2022/2554',
              affectedCategory: 'compliance',
            });
          }
          if (presentCategories.has('cyber')) {
            recommendations.push({
              id: 'reg-sec-cyber',
              type: 'regulation',
              urgency: 'high',
              headline: 'SEC cybersecurity disclosure rules',
              reasoning: "The SEC's cybersecurity disclosure rules require publicly traded companies to assess and disclose material cyber risks within 4 business days of a determination. Unassessed cyber risks create liability if a reportable incident occurs before an assessment is completed.",
              source: 'SEC Release 33-11216',
              affectedCategory: 'cyber',
            });
          }
          if (presentCategories.has('financial')) {
            recommendations.push({
              id: 'reg-ifrs9',
              type: 'regulation',
              urgency: 'medium',
              headline: 'IFRS 9 credit loss provisioning update',
              reasoning: 'Recent IASB guidance clarifies forward-looking ECL model requirements under IFRS 9. Changes to macroeconomic scenarios should trigger a reassessment of credit and liquidity risk ratings to ensure provisioning levels remain adequate.',
              source: 'IASB IFRS 9 Update Q1 2026',
              affectedCategory: 'financial',
            });
          }

          // 4 — News/trend triggers
          if (presentCategories.has('cyber')) {
            recommendations.push({
              id: 'news-ransomware',
              type: 'news',
              urgency: 'high',
              headline: 'Ransomware attacks up 38% this quarter',
              reasoning: 'Threat intelligence reports a 38% increase in ransomware incidents targeting mid-market enterprises in Q1 2026, with healthcare and professional services most affected. Peer benchmarks suggest organizations with unassessed cyber risks take 2.4× longer to contain incidents.',
              source: 'CrowdStrike Global Threat Report Q1 2026',
              affectedCategory: 'cyber',
            });
          }
          if (presentCategories.has('operational')) {
            recommendations.push({
              id: 'news-supply',
              type: 'news',
              urgency: 'medium',
              headline: 'Red Sea shipping disruptions continue',
              reasoning: 'Ongoing maritime disruptions are extending lead times by 3–6 weeks for goods transiting through the Suez Canal. Organizations with supplier concentration in Asia or Europe should review operational and supply chain risk ratings for updated likelihood scores.',
              source: 'Reuters Supply Chain Monitor, Mar 2026',
              affectedCategory: 'operational',
            });
          }
          if (presentCategories.has('strategic')) {
            recommendations.push({
              id: 'news-ai',
              type: 'news',
              urgency: 'medium',
              headline: 'AI adoption accelerating competitive pressure',
              reasoning: 'Gartner research shows 62% of enterprises have deployed AI in at least one core business process. Organizations that have not yet assessed strategic risks related to digital transformation and competitive disruption risk falling behind the assessment cycle.',
              source: 'Gartner Technology Trends 2026',
              affectedCategory: 'strategic',
            });
          }

          // 5 — Periodic trigger (always)
          recommendations.push({
            id: 'periodic-q1',
            type: 'periodic',
            urgency: 'medium',
            headline: 'Q1 2026 periodic review cycle',
            reasoning: 'Risk frameworks including ISO 31000 and COSO ERM recommend a full risk reassessment at least quarterly. Completing a periodic review now ensures that risk ratings reflect current operating conditions and any changes since the last cycle.',
            source: 'ISO 31000:2018 · COSO ERM 2017',
          });

          const typeConfig: Record<string, { label: string; Icon: React.ElementType }> = {
            priority:   { label: 'Risk priority',  Icon: ShieldIcon },
            regulation: { label: 'Regulation',     Icon: RegulationIcon },
            news:       { label: 'Industry news',  Icon: NewsIcon },
            periodic:   { label: 'Periodic review',Icon: PeriodicIcon },
          };
          // Urgency retains color — it's a meaningful risk signal (like severity)
          const urgencyConfig: Record<string, { label: string; color: string; bg: string }> = {
            critical: { label: 'Critical', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
            high:     { label: 'High',     color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' },
            medium:   { label: 'Medium',   color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
          };

          return (
          <>
          {/* ── Coverage banner + action stats ── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Coverage card - wide */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                variant="outlined"
                sx={{ p: 2.5, height: '100%', borderColor: coveragePct < 30 ? 'rgba(244,67,54,0.3)' : 'divider' }}
              >
                <Stack spacing={2} sx={{ height: '100%' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                        Assessment coverage
                      </Typography>
                      <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ mt: 0.25 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1 }}>
                          {coveragePct}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          of {risks.length} risks assessed
                        </Typography>
                      </Stack>
                    </Box>
                    <Chip
                      size="small"
                      label={coveragePct >= 70 ? 'Good' : coveragePct >= 40 ? 'Fair' : 'Low'}
                      sx={{
                        height: 24, fontWeight: 600,
                        bgcolor: coveragePct >= 70 ? 'rgba(76,175,80,0.15)' : coveragePct >= 40 ? 'rgba(237,108,2,0.12)' : 'rgba(244,67,54,0.15)',
                        color: coveragePct >= 70 ? '#4caf50' : coveragePct >= 40 ? '#ed6c02' : '#f44336',
                      }}
                    />
                  </Stack>

                  {/* Segmented progress bar */}
                  <Box>
                    <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: '2px' }}>
                      <Box sx={{ flex: assessedRisks.length, bgcolor: '#4caf50', minWidth: assessedRisks.length > 0 ? 4 : 0, transition: 'flex 0.4s' }} />
                      <Box sx={{ flex: inProgressRisks.length, bgcolor: '#60a5fa', minWidth: inProgressRisks.length > 0 ? 4 : 0, transition: 'flex 0.4s' }} />
                      <Box sx={{ flex: unassessedRisks.length, bgcolor: 'rgba(255,255,255,0.08)', minWidth: unassessedRisks.length > 0 ? 4 : 0, transition: 'flex 0.4s' }} />
                    </Box>
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      {[
                        { label: 'Assessed', count: assessedRisks.length, color: '#4caf50' },
                        { label: 'In progress', count: inProgressRisks.length, color: '#60a5fa' },
                        { label: 'Unassessed', count: unassessedRisks.length, color: 'text.secondary' },
                      ].map(s => (
                        <Stack key={s.label} direction="row" spacing={0.5} alignItems="center">
                          <DotIcon sx={{ fontSize: 8, color: s.color }} />
                          <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{s.count}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* High-priority unassessed */}
            <Grid size={{ xs: 6, md: 3 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5, height: '100%',
                  borderColor: highSevUnassessed.length > 0 ? 'rgba(244,67,54,0.35)' : 'divider',
                  bgcolor: highSevUnassessed.length > 0 ? 'rgba(244,67,54,0.03)' : 'transparent',
                }}
              >
                <Stack spacing={1} sx={{ height: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PriorityIcon sx={{ fontSize: 16, color: '#C42B31' }} />
                    <Typography variant="caption" color="text.secondary">High-priority gaps</Typography>
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: highSevUnassessed.length > 0 ? '#C42B31' : 'text.primary', lineHeight: 1 }}>
                    {highSevUnassessed.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    high/critical severity risks still unassessed
                  </Typography>
                  {highSevUnassessed.length > 0 && (
                    <Button
                      size="small" variant="outlined"
                      onClick={() => {
                        setGroupBy('severity');
                        setTimeout(() => assessmentGroupsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
                      }}
                      sx={{ alignSelf: 'flex-start', mt: 'auto' }}
                    >
                      View by severity
                    </Button>
                  )}
                </Stack>
              </Paper>
            </Grid>

            {/* Completed assessments */}
            <Grid size={{ xs: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                <Stack spacing={1} sx={{ height: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CompletedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">Assessments done</Typography>
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
                    {existingAssessmentGroups.filter(g => g.isCompleted).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    of {assessmentGroups.length} possible assessment groups completed
                  </Typography>
                  <Button
                    size="small" variant="text"
                    onClick={() => setActiveTab(1)}
                    sx={{ alignSelf: 'flex-start', mt: 'auto' }}
                  >
                    View existing →
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* ── Intelligent recommendations ── */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
            <SparkleIcon sx={{ fontSize: 18, color: 'primary.light' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Recommended assessments
            </Typography>
            <Chip size="small" label={`${recommendations.length} triggers`} sx={{ height: 20, fontSize: '0.7rem' }} />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Based on your risk register, active regulations, and industry intelligence — sorted by urgency.
          </Typography>

          {/* Expandable vertical list */}
          <Stack spacing={1} sx={{ mb: 3 }}>
            {recommendations.map(rec => {
              const tc = typeConfig[rec.type];
              const uc = urgencyConfig[rec.urgency];
              const TypeIcon = tc.Icon;
              const isOpen = expandedRec === rec.id;
              return (
                <Paper key={rec.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                  {/* Header — always visible */}
                  <Box
                    sx={{
                      px: 2, py: 1.25,
                      display: 'flex', alignItems: 'center', gap: 1.5,
                    }}
                  >
                    {/* Clickable left section: icon + text */}
                    <Box
                      onClick={() => setExpandedRec(isOpen ? null : rec.id)}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0, cursor: 'pointer' }}
                    >
                      <TypeIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{rec.headline}</Typography>
                          <Chip
                            size="small"
                            label={uc.label}
                            sx={{ height: 17, fontSize: '0.65rem', fontWeight: 600, bgcolor: uc.bg, color: uc.color, flexShrink: 0 }}
                          />
                        </Stack>
                        <Typography variant="caption" color="text.disabled">
                          {tc.label}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Right: persistent action buttons */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<StartIcon sx={{ fontSize: '14px !important' }} />}
                        onClick={() => {
                          if (rec.affectedCategory) setGroupBy('category');
                          else if (rec.urgency === 'critical' || rec.id === 'prio-high') setGroupBy('severity');
                          setTimeout(() => assessmentGroupsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
                        }}
                      >
                        Start assessment
                      </Button>
                      <Box
                        onClick={() => setExpandedRec(isOpen ? null : rec.id)}
                        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'text.secondary', pl: 0.5 }}
                      >
                        {isOpen
                          ? <ExpandLessIcon sx={{ fontSize: 18 }} />
                          : <ExpandMoreIcon sx={{ fontSize: 18 }} />
                        }
                      </Box>
                    </Stack>
                  </Box>

                  {/* Expanded: reasoning + metadata only */}
                  <Collapse in={isOpen}>
                    <Box sx={{ px: 2, pb: 2, pt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 1.25 }}>
                        {rec.reasoning}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                          {rec.source}
                        </Typography>
                        {rec.affectedCount !== undefined && (
                          <Chip size="small" label={`${rec.affectedCount} risk${rec.affectedCount !== 1 ? 's' : ''} affected`} sx={{ height: 18, fontSize: '0.68rem' }} />
                        )}
                        {rec.affectedCategory && (
                          <Chip
                            size="small"
                            label={rec.affectedCategory.charAt(0).toUpperCase() + rec.affectedCategory.slice(1)}
                            sx={{ height: 18, fontSize: '0.68rem' }}
                          />
                        )}
                      </Stack>
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}
          </Stack>

          {/* ── Grouping controls ── */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} ref={assessmentGroupsRef}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              All assessment groups
            </Typography>
            <ToggleButtonGroup
              value={groupBy}
              exclusive
              onChange={handleGroupByChange}
              size="small"
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', py: 0.5 } }}
            >
              <ToggleButton value="category">
                <CategoryIcon sx={{ fontSize: 16, mr: 0.5 }} /> Category
              </ToggleButton>
              <ToggleButton value="owner">
                <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} /> Owner
              </ToggleButton>
              <ToggleButton value="severity">
                <SeverityIcon sx={{ fontSize: 16, mr: 0.5 }} /> Severity
              </ToggleButton>
              <ToggleButton value="department">
                <DepartmentIcon sx={{ fontSize: 16, mr: 0.5 }} /> Department
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Stack spacing={1}>
            {assessmentGroups.map((group) => {
              const GroupIcon = getGroupIcon(group);
              return (
              <Paper key={group.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                {/* Header — mirrors recommendation card layout */}
                <Box
                  sx={{
                    px: 2, py: 1.25,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                  }}
                >
                  {/* Clickable left: icon + label */}
                  <Box
                    onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0, cursor: 'pointer' }}
                  >
                    <GroupIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {group.label}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${group.risks.length} ${group.risks.length === 1 ? 'risk' : 'risks'}`}
                          sx={{ height: 17, fontSize: '0.65rem', flexShrink: 0 }}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.disabled">
                        {group.description}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Right: persistent action buttons */}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      endIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailGroup(group);
                      }}
                    >
                      Show details
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<StartIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      Start assessment
                    </Button>
                    <Box
                      onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                      sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'text.secondary', pl: 0.5 }}
                    >
                      {expandedGroup === group.id ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                    </Box>
                  </Stack>
                </Box>

                <Collapse in={expandedGroup === group.id}>
                  <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'rgba(13, 17, 23, 0.5)' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Risk</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Inherent score</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Owner</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {group.risks.map((risk) => (
                            <TableRow key={risk.id} hover>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {risk.title}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={risk.category.charAt(0).toUpperCase() + risk.category.slice(1)}
                                  variant="outlined"
                                  sx={{ 
                                    height: 22, 
                                    fontSize: '0.75rem',
                                    borderColor: 'grey.300',
                                    color: 'text.secondary',
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Box
                                    sx={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: 0.5,
                                      bgcolor: getScoreColor(risk),
                                    }}
                                  />
                                  <Typography variant="body2">
                                    {getScoreLabel(risk)}
                                  </Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>
                                {risk.suggestedOwner ? (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Avatar
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        fontSize: '0.75rem',
                                        bgcolor: ownerColors[risk.suggestedOwner.name] || '#6B7280',
                                      }}
                                    >
                                      {risk.suggestedOwner.name.split(' ').map(n => n[0]).join('')}
                                    </Avatar>
                                    <Typography variant="body2">
                                      {risk.suggestedOwner.name}
                                    </Typography>
                                  </Stack>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Unassigned
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Collapse>
              </Paper>
              );
            })}
          </Stack>
          </>
          );
        })()
      )}

      {activeTab === 1 && (() => {
        const inProgressCount = existingAssessmentGroups.filter(g => !g.isCompleted).length;
        const completedCount = existingAssessmentGroups.filter(g => g.isCompleted).length;
        const overdueCount = existingAssessmentGroups.filter(g => g.isOverdue).length;
        const totalAssessed = existingAssessmentGroups.reduce((s, g) => s + g.assessed, 0);
        const totalInExisting = existingAssessmentGroups.reduce((s, g) => s + g.total, 0);
        const highPriorityInProgress = existingAssessmentGroups.filter(g => !g.isCompleted && g.highSevCount > 0);

        const filtered = existingAssessmentGroups.filter(g => {
          if (existingFilter === 'in_progress') return !g.isCompleted;
          if (existingFilter === 'completed') return g.isCompleted;
          return true;
        });

        if (existingAssessmentGroups.length === 0) {
          return (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                No assessments in progress yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start an assessment from the suggestions tab and it will appear here.
              </Typography>
            </Paper>
          );
        }

        return (
          <>
            {/* Stats row */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ClockIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">In progress</Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{inProgressCount}</Typography>
                    <Typography variant="caption" color="text.secondary">active assessment{inProgressCount !== 1 ? 's' : ''}</Typography>
                  </Stack>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CompletedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">Completed</Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{completedCount}</Typography>
                    <Typography variant="caption" color="text.secondary">assessment{completedCount !== 1 ? 's' : ''} done</Typography>
                  </Stack>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                {/* Overdue retains red — it's an action-required signal like severity */}
                <Paper variant="outlined" sx={{ p: 2, height: '100%', borderColor: overdueCount > 0 ? 'rgba(248,113,113,0.3)' : undefined }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <OverdueIcon sx={{ fontSize: 18, color: overdueCount > 0 ? '#f87171' : 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">Overdue</Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: overdueCount > 0 ? '#f87171' : undefined }}>{overdueCount}</Typography>
                    <Typography variant="caption" color="text.secondary">past target date</Typography>
                  </Stack>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ProgressIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">Overall progress</Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalInExisting > 0 ? Math.round((totalAssessed / totalInExisting) * 100) : 0}%</Typography>
                    <Typography variant="caption" color="text.secondary">{totalAssessed} of {totalInExisting} risks assessed</Typography>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            {/* High priority spotlight — red is appropriate here: it's an action-required risk signal */}
            {highPriorityInProgress.length > 0 && (
              <Box
                sx={{
                  mb: 3, p: 2, borderRadius: 2,
                  border: '1px solid rgba(248,113,113,0.2)',
                  borderLeft: '3px solid #f87171',
                  background: 'rgba(248,113,113,0.03)',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                  <PriorityIcon sx={{ color: '#f87171', fontSize: 16 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Needs immediate attention
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {highPriorityInProgress.reduce((s, g) => s + g.highSevCount, 0)} high-severity risks across in-progress assessments
                  </Typography>
                </Stack>
                <Stack spacing={0.75}>
                  {highPriorityInProgress.slice(0, 3).map(g => (
                    <Box
                      key={g.id}
                      sx={{
                        px: 1.5, py: 1, borderRadius: 1.5,
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(8,13,24,0.4)',
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{g.label}</Typography>
                            {g.isOverdue && (
                              <Chip size="small" label="Overdue" sx={{ height: 17, fontSize: '0.65rem', bgcolor: 'rgba(248,113,113,0.12)', color: '#f87171' }} />
                            )}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {g.highSevCount} high/critical · {g.progress}% assessed · {g.total} in scope
                          </Typography>
                        </Box>
                        <Button size="small" variant="outlined" endIcon={<ArrowIcon />} sx={{ flexShrink: 0 }}>
                          Continue
                        </Button>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Filter chips */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>Show:</Typography>
              {(['all', 'in_progress', 'completed'] as const).map(f => (
                <Chip
                  key={f}
                  label={f === 'all' ? `All (${existingAssessmentGroups.length})` : f === 'in_progress' ? `In progress (${inProgressCount})` : `Completed (${completedCount})`}
                  size="small"
                  onClick={() => setExistingFilter(f)}
                  variant={existingFilter === f ? 'filled' : 'outlined'}
                  sx={{
                    height: 28,
                    cursor: 'pointer',
                    ...(existingFilter === f
                      ? { bgcolor: 'rgba(96,165,250,0.18)', color: 'primary.light', border: '1px solid rgba(96,165,250,0.35)' }
                      : { color: 'text.secondary' }),
                  }}
                />
              ))}
            </Stack>

            {/* Assessment cards */}
            {filtered.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No {existingFilter === 'in_progress' ? 'in-progress' : 'completed'} assessments.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {filtered.map(g => {
                  const statusChip = g.isOverdue
                    ? { label: 'Overdue', bg: 'rgba(244,67,54,0.15)', color: '#f44336', border: 'rgba(244,67,54,0.35)' }
                    : g.isCompleted
                    ? { label: 'Completed', bg: 'rgba(76,175,80,0.15)', color: '#4caf50', border: 'rgba(76,175,80,0.35)' }
                    : { label: 'In progress', bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: 'rgba(96,165,250,0.3)' };

                  // Progress bar color reflects status — semantic, not decorative
                  const barColor = g.isOverdue ? '#f87171' : g.isCompleted ? '#34d399' : '#60a5fa';

                  return (
                    <Paper key={g.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                      <Box sx={{ p: 2.5 }}>
                          {/* Header row */}
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                            <Box sx={{ flex: 1, mr: 2 }}>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                  {g.label}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={statusChip.label}
                                  sx={{ height: 20, fontSize: '0.7rem', bgcolor: statusChip.bg, color: statusChip.color, border: `1px solid ${statusChip.border}` }}
                                />
                                {g.highSevCount > 0 && !g.isCompleted && (
                                  <Chip
                                    size="small"
                                    icon={<SeverityIcon sx={{ fontSize: '11px !important', color: '#f87171 !important' }} />}
                                    label={`${g.highSevCount} high severity`}
                                    sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(248,113,113,0.1)', color: '#f87171' }}
                                  />
                                )}
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                {g.description}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, mt: 0.25 }}>
                              {g.daysSinceStart === 0 ? 'Started today' : `Started ${g.daysSinceStart}d ago`}
                            </Typography>
                          </Stack>

                          {/* Progress */}
                          <Box sx={{ mb: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                              <Typography variant="caption" color="text.secondary">Assessment progress</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {g.assessed} of {g.total} risks assessed · {g.progress}%
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={g.progress}
                              sx={{
                                height: 5, borderRadius: 3,
                                bgcolor: 'rgba(255,255,255,0.06)',
                                '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 3 },
                              }}
                            />
                          </Box>

                          <Divider sx={{ borderColor: 'rgba(96,165,250,0.07)', mb: 2 }} />

                          {/* Footer row */}
                          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                            {/* Assessors */}
                            <Stack direction="row" spacing={1} alignItems="center">
                              <AvatarGroup
                                max={4}
                                sx={{
                                  '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, border: '2px solid rgba(14,20,35,0.8)' },
                                  '& .MuiAvatarGroup-avatar': { bgcolor: 'rgba(96,165,250,0.2)', color: 'primary.light', fontSize: '0.65rem' },
                                }}
                              >
                                {g.assessors.map(a => (
                                  <Tooltip key={a.name} title={`${a.name} · ${a.role}`} arrow>
                                    <Avatar
                                      sx={{ bgcolor: ownerColors[a.name] || '#6B7280' }}
                                    >
                                      {a.name.split(' ').map(n => n[0]).join('')}
                                    </Avatar>
                                  </Tooltip>
                                ))}
                              </AvatarGroup>
                              <Typography variant="caption" color="text.secondary">
                                {g.assessors.length} assessor{g.assessors.length !== 1 ? 's' : ''}
                              </Typography>
                            </Stack>

                            {/* Actions */}
                            <Stack direction="row" spacing={1}>
                              {g.isCompleted ? (
                                <>
                                  <Button size="small" variant="text">
                                    Archive
                                  </Button>
                                  <Button size="small" variant="outlined" endIcon={<ArrowIcon />}>
                                    Review results
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button size="small" variant="text">
                                    View risks
                                  </Button>
                                  <Button size="small" variant="contained" endIcon={<ArrowIcon />}>
                                    Continue
                                  </Button>
                                </>
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </>
        );
      })()}

      </Box>{/* end main content column */}

      {/* ── Docked detail panel (50 % of content area, sticky) ── */}
      {detailGroup && (
        <Box sx={{
          width: '48%',
          flexShrink: 0,
          position: 'sticky',
          top: '56px',            /* stick just below the fixed header */
          height: 'calc(100vh - 56px)',
          overflowY: 'auto',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(8,13,24,0.55)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        }}>
          <AssessmentDetailPanel
            group={detailGroup}
            onClose={() => setDetailGroup(null)}
            onStart={() => setDetailGroup(null)}
          />
        </Box>
      )}
    </Box>
  );
}
