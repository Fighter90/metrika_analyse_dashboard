import type { DecisionMethod, DecisionOutcome, FindingConfidence, NewDecision } from '@pca/shared';

export interface DecisionForm {
  hypothesisId: number; // 0 = none selected
  date: string;
  method: DecisionMethod;
  scope: string;
  periodDays: number;
  findingText: string;
  findingConfidence: FindingConfidence;
  evidenceQuote: string;
  evidenceSource: string;
  outcome: DecisionOutcome;
  outcomeRationale: string;
  nextStep: string;
  decidedBy: string;
}

export function emptyDecisionForm(): DecisionForm {
  return {
    hypothesisId: 0,
    date: new Date().toISOString().slice(0, 10),
    method: 'mixed',
    scope: '',
    periodDays: 5,
    findingText: '',
    findingConfidence: 'medium',
    evidenceQuote: '',
    evidenceSource: '',
    outcome: 'yellow',
    outcomeRationale: '',
    nextStep: '',
    decidedBy: '',
  };
}

/** A Decision Log entry needs a linked hypothesis, evidence (backend-required) and the next step. */
export function decisionFormValid(f: DecisionForm): boolean {
  return (
    f.hypothesisId > 0 &&
    f.scope.trim().length > 0 &&
    f.periodDays >= 1 &&
    f.findingText.trim().length > 0 &&
    f.evidenceQuote.trim().length > 0 &&
    f.evidenceSource.trim().length > 0 &&
    f.outcomeRationale.trim().length > 0 &&
    f.nextStep.trim().length > 0 &&
    f.decidedBy.trim().length > 0
  );
}

export function decisionFormToInput(f: DecisionForm): NewDecision {
  return {
    hypothesisId: f.hypothesisId,
    date: f.date,
    method: f.method,
    scope: f.scope,
    periodDays: f.periodDays,
    findings: [{ text: f.findingText, confidence: f.findingConfidence }],
    evidence: [{ quote: f.evidenceQuote, source: f.evidenceSource }],
    outcome: f.outcome,
    outcomeRationale: f.outcomeRationale,
    nextStep: f.nextStep,
    decidedBy: f.decidedBy,
  };
}
