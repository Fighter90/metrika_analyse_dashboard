import { describe, it, expect } from 'vitest';
import { emptyDecisionForm, decisionFormValid, decisionFormToInput } from './decision-form';

function filled() {
  return {
    ...emptyDecisionForm(),
    hypothesisId: 3,
    scope: '5 интервью',
    findingText: 'подкаст хуже',
    evidenceQuote: 'отложу на потом',
    evidenceSource: 'synthetic CTO',
    outcomeRationale: 'разрыв частично',
    nextStep: 'solution: онлайн-оплата',
    decidedBy: 'команда',
  };
}

describe('decisionFormValid', () => {
  it('is false until all required fields + a hypothesis are set', () => {
    expect(decisionFormValid(emptyDecisionForm())).toBe(false);
    expect(decisionFormValid({ ...filled(), evidenceSource: '' })).toBe(false);
    expect(decisionFormValid({ ...filled(), hypothesisId: 0 })).toBe(false);
    expect(decisionFormValid(filled())).toBe(true);
  });
});

describe('decisionFormToInput', () => {
  it('wraps a single finding + evidence and coerces the hypothesis id', () => {
    const input = decisionFormToInput(filled());
    expect(input.hypothesisId).toBe(3);
    expect(input.findings).toHaveLength(1);
    expect(input.evidence[0]).toEqual({ quote: 'отложу на потом', source: 'synthetic CTO' });
  });
});
