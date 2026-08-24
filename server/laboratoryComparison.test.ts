import { describe, expect, it } from 'vitest';
import { compareLaboratoryRun, compareValidationSeries } from './laboratoryComparison';

describe('laboratory comparison engine', () => {
  const series = {
    name: 'temperature',
    unit: 'degC',
    simulation: [
      { timestampSeconds: 0, value: 20 },
      { timestampSeconds: 10, value: 40 },
      { timestampSeconds: 20, value: 60 },
    ],
    laboratory: [
      { timestampSeconds: 5, value: 30 },
      { timestampSeconds: 15, value: 50 },
    ],
  };

  it('interpolates simulation values onto laboratory timestamps', () => {
    const result = compareValidationSeries(series, [
      { metric: 'MAE', maxValue: 0.01, unit: 'degC' },
      { metric: 'RMSE', maxValue: 0.01, unit: 'degC' },
    ]);
    expect(result.sampleCount).toBe(2);
    expect(result.metrics.every((metric) => metric.passed)).toBe(true);
  });

  it('fails a declared acceptance criterion without changing the measurements', () => {
    const result = compareLaboratoryRun([series], {
      temperature: [{ metric: 'MAE', maxValue: 0, unit: 'degC' }],
    });
    expect(result.status).toBe('PASS');

    const shifted = { ...series, laboratory: series.laboratory.map((point) => ({ ...point, value: point.value + 5 })) };
    const failed = compareLaboratoryRun([shifted], {
      temperature: [{ metric: 'MAE', maxValue: 0, unit: 'degC' }],
    });
    expect(failed.status).toBe('FAIL');
  });

  it('refuses to produce PASS when there is no time overlap', () => {
    const result = compareLaboratoryRun(
      [{ ...series, laboratory: [{ timestampSeconds: 100, value: 30 }] }],
      { temperature: [{ metric: 'MAE', maxValue: 1, unit: 'degC' }] },
    );
    expect(result.status).toBe('INCONCLUSIVE');
    expect(result.reasons[0]).toContain('No time-overlap samples');
  });
});
