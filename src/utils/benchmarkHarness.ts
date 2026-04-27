import { AnalyticsEngine } from './analyticsEngine';
import { PerQuestionAnalytics } from './perQuestionAnalytics';
import { buildSessionResultV2 } from './sessionResultAdapter';
import { ScoringRegressionFixture } from './evaluationFixtures';
import { SessionResultV2 } from '../types/sessionResult';

export interface ScoringRegressionResult {
  fixture_id: string;
  label: string;
  passed: boolean;
  failures: string[];
  overall_score: number;
  result: SessionResultV2;
}

export interface ScoringRegressionSummary {
  total: number;
  passed: number;
  failed: number;
  pass_rate: number;
  results: ScoringRegressionResult[];
}

export function runScoringRegressionSuite(
  fixtures: ScoringRegressionFixture[]
): ScoringRegressionSummary {
  const results = fixtures.map(runScoringRegressionFixture);
  const passed = results.filter((result) => result.passed).length;

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    pass_rate: results.length === 0 ? 0 : Number((passed / results.length).toFixed(2)),
    results
  };
}

export function runScoringRegressionFixture(
  fixture: ScoringRegressionFixture
): ScoringRegressionResult {
  const metrics = AnalyticsEngine.process({
    durationSecs: fixture.durationSecs,
    transcript: fixture.transcript,
    role: fixture.role,
    postureData: fixture.postureData
  });
  const perQuestionAnalysis = PerQuestionAnalytics.process(fixture.transcript, {
    postureData: fixture.postureData,
    overallMetrics: metrics
  });
  const result = buildSessionResultV2({
    id: fixture.id,
    transcript: fixture.transcript,
    duration: fixture.durationSecs,
    metrics,
    perQuestionAnalysis,
    postureData: fixture.postureData,
    jobContext: {
      role: fixture.role
    },
    processingSource: 'regression-fixture'
  });

  const failures: string[] = [];
  const overall = result.overall_scores.overall;

  if (overall < fixture.expected.minOverall || overall > fixture.expected.maxOverall) {
    failures.push(
      `overall score ${overall} outside expected band ${fixture.expected.minOverall}-${fixture.expected.maxOverall}`
    );
  }

  for (const flag of fixture.expected.requiredReliabilityFlags || []) {
    if (!result.signal_reliability.reason_flags.includes(flag)) {
      failures.push(`missing reliability flag ${flag}`);
    }
  }

  if (fixture.expected.requiredDrillTypes?.length) {
    const drillTypes = result.recommended_drills.map((drill) => drill.drill_type);
    const hasRequiredDrill = fixture.expected.requiredDrillTypes.some((type) => drillTypes.includes(type));
    if (!hasRequiredDrill) {
      failures.push(`missing one of required drill types: ${fixture.expected.requiredDrillTypes.join(', ')}`);
    }
  }

  return {
    fixture_id: fixture.id,
    label: fixture.label,
    passed: failures.length === 0,
    failures,
    overall_score: overall,
    result
  };
}
