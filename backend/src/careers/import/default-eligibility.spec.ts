import {
  computeEligibility,
  computeGovernmentEligibility,
} from './default-eligibility.config';

describe('computeEligibility', () => {
  describe('science category', () => {
    it('should return PCM eligibility for science_pcm', () => {
      const { eligibility } = computeEligibility('science', 'science_pcm');
      expect(eligibility.min_maths).toBe(60);
      expect(eligibility.min_science).toBe(55);
      expect(eligibility.min_biology).toBe(0);
      expect(eligibility.required_stream).toBe('PCM');
    });

    it('should return PCB eligibility for science_pcb', () => {
      const { eligibility } = computeEligibility('science', 'science_pcb');
      expect(eligibility.min_maths).toBe(0);
      expect(eligibility.min_science).toBe(60);
      expect(eligibility.min_biology).toBe(55);
      expect(eligibility.required_stream).toBe('PCB');
    });

    it('should return PCMB eligibility for science_pcmb', () => {
      const { eligibility } = computeEligibility('science', 'science_pcmb');
      expect(eligibility.min_maths).toBe(55);
      expect(eligibility.min_science).toBe(60);
      expect(eligibility.min_biology).toBe(50);
      expect(eligibility.required_stream).toBe('PCMB');
    });
  });

  describe('commerce category', () => {
    it('should return commerce eligibility for any sub_domain', () => {
      const { eligibility } = computeEligibility('commerce', 'b_com');
      expect(eligibility.min_maths).toBe(40);
      expect(eligibility.required_stream).toBe('Commerce');
      expect(eligibility.min_study_duration_years).toBe(3);
      expect(eligibility.max_budget_tier).toBe(3);
    });

    it('should return same for bba', () => {
      const { eligibility } = computeEligibility('commerce', 'bba');
      expect(eligibility.min_maths).toBe(40);
      expect(eligibility.required_stream).toBe('Commerce');
    });
  });

  describe('arts_humanities category', () => {
    it('should return arts eligibility', () => {
      const { eligibility } = computeEligibility(
        'arts_humanities',
        'ba_psychology',
      );
      expect(eligibility.required_stream).toBe('Arts');
      expect(eligibility.min_study_duration_years).toBe(3);
      expect(eligibility.max_budget_tier).toBe(2);
    });
  });

  describe('diploma category', () => {
    it('should return diploma eligibility', () => {
      const { eligibility } = computeEligibility(
        'diploma',
        'computer_engineering',
      );
      expect(eligibility.min_maths).toBe(35);
      expect(eligibility.min_science).toBe(35);
      expect(eligibility.required_stream).toBe('any');
      expect(eligibility.min_study_duration_years).toBe(3);
      expect(eligibility.max_budget_tier).toBe(2);
    });
  });

  describe('iti_polytechnic category', () => {
    it('should return ITI eligibility', () => {
      const { eligibility } = computeEligibility(
        'iti_polytechnic',
        'iti_electrician',
      );
      expect(eligibility.min_study_duration_years).toBe(1);
      expect(eligibility.max_budget_tier).toBe(1);
      expect(eligibility.required_stream).toBe('any');
    });
  });

  describe('vocational category', () => {
    it('should return vocational eligibility', () => {
      const { eligibility } = computeEligibility('vocational', 'healthcare');
      expect(eligibility.min_study_duration_years).toBe(0.5);
      expect(eligibility.max_budget_tier).toBe(1);
    });
  });

  describe('government_defence category', () => {
    it('should return open entry for ssc', () => {
      const { eligibility, needs_enrichment } = computeEligibility(
        'government_defence',
        'ssc',
      );
      expect(eligibility.min_study_duration_years).toBe(0);
      expect(eligibility.max_study_duration_years).toBe(1);
      expect(needs_enrichment).toBe(false);
    });

    it('should return open entry for railways_rrb', () => {
      const { eligibility, needs_enrichment } = computeEligibility(
        'government_defence',
        'railways_rrb',
      );
      expect(eligibility.min_study_duration_years).toBe(0);
      expect(needs_enrichment).toBe(false);
    });

    it('should return open entry for indian_army', () => {
      const { eligibility, needs_enrichment } = computeEligibility(
        'government_defence',
        'indian_army',
      );
      expect(eligibility.min_study_duration_years).toBe(0);
      expect(eligibility.max_study_duration_years).toBe(1);
      expect(needs_enrichment).toBe(false);
    });

    it('should require graduation for upsc and flag enrichment', () => {
      const { eligibility, needs_enrichment } = computeEligibility(
        'government_defence',
        'upsc',
      );
      expect(eligibility.min_study_duration_years).toBe(3);
      expect(needs_enrichment).toBe(true);
    });

    it('should require graduation for judiciary and flag enrichment', () => {
      const { eligibility, needs_enrichment } = computeEligibility(
        'government_defence',
        'judiciary',
      );
      expect(eligibility.min_study_duration_years).toBe(3);
      expect(needs_enrichment).toBe(true);
    });
  });

  describe('emerging_future category', () => {
    it('should return default PCM eligibility for most sub_domains', () => {
      const { eligibility } = computeEligibility(
        'emerging_future',
        'artificial_intelligence',
      );
      expect(eligibility.min_maths).toBe(55);
      expect(eligibility.required_stream).toBe('PCM');
      expect(eligibility.max_budget_tier).toBe(2);
    });

    it('should return relaxed eligibility for freelancing', () => {
      const { eligibility } = computeEligibility(
        'emerging_future',
        'freelancing',
      );
      expect(eligibility.min_maths).toBe(0);
      expect(eligibility.required_stream).toBe('any');
      expect(eligibility.min_study_duration_years).toBe(0);
    });

    it('should return relaxed eligibility for creator_economy', () => {
      const { eligibility } = computeEligibility(
        'emerging_future',
        'creator_economy',
      );
      expect(eligibility.min_maths).toBe(0);
      expect(eligibility.required_stream).toBe('any');
    });
  });

  describe('error handling', () => {
    it('should throw for unknown category', () => {
      expect(() => computeEligibility('unknown', 'foo')).toThrow(
        'Unknown category_code',
      );
    });
  });
});

describe('computeGovernmentEligibility (direct)', () => {
  it('should handle intelligence_agencies default', () => {
    const result = computeGovernmentEligibility('intelligence_agencies');
    expect(result.needs_enrichment).toBe(false);
    expect(result.min_study_duration_years).toBe(0);
  });
});
