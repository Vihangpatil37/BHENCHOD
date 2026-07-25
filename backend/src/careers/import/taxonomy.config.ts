/**
 * Taxonomy configuration for career catalog import.
 *
 * Maps each category_code to its allowed sub_domain_codes.
 * These slugs must be used consistently so that eligibility/weight rules apply correctly.
 */
export const TAXONOMY: Record<string, string[]> = {
  science: ['science_pcm', 'science_pcb', 'science_pcmb'],

  commerce: [
    'b_com',
    'bba',
    'bms',
    'ca',
    'cs',
    'cma',
    'economics',
    'finance',
    'banking',
    'international_business',
    'digital_business',
    'fintech',
    'business_analytics',
    'entrepreneurship',
  ],

  arts_humanities: [
    'ba_psychology',
    'ba_political_science',
    'ba_sociology',
    'ba_history',
    'ba_geography',
    'ba_english',
    'journalism_mass_comm',
    'llb_integrated',
    'fine_arts',
    'performing_arts',
    'design',
    'foreign_languages',
    'social_work',
    'education',
  ],

  diploma: [
    'computer_engineering',
    'information_technology',
    'ai_ml',
    'data_science',
    'cyber_security',
    'electronics_comm',
    'electrical_engineering',
    'mechanical_engineering',
    'civil_engineering',
    'automobile_engineering',
    'mechatronics',
    'robotics',
    'chemical_engineering',
    'architecture_assistantship',
    'medical_lab_tech',
    'pharmacy',
    'fashion_design',
    'interior_design',
    'animation_multimedia',
    'hotel_management',
    'aviation',
    'marine_engineering',
  ],

  iti_polytechnic: [
    'iti_electrician',
    'iti_fitter',
    'iti_copa',
    'iti_welder',
    'iti_diesel_mechanic',
    'iti_motor_vehicle',
    'iti_hvac',
    'iti_electronics_mechanic',
    'iti_draughtsman_civil',
    'iti_draughtsman_mechanical',
    'iti_other_trades',
  ],

  vocational: [
    'healthcare',
    'beauty_wellness',
    'hospitality_tourism',
    'food_bakery',
    'retail_sales',
    'digital_marketing',
    'photography_media',
    'animation_gaming',
    'agriculture',
    'renewable_energy',
    'drone_technology',
    'logistics_supply_chain',
    'sports_fitness',
    'fashion_apparel',
    'entrepreneurship',
  ],

  government_defence: [
    'upsc',
    'ssc',
    'banking_govt',
    'railways_rrb',
    'indian_army',
    'indian_navy',
    'indian_air_force',
    'capf',
    'police_services',
    'judiciary',
    'teaching_govt',
    'psu_companies',
    'research_organisations',
    'intelligence_agencies',
  ],

  emerging_future: [
    'artificial_intelligence',
    'data_science_emerging',
    'cyber_security_emerging',
    'cloud_computing',
    'robotics_automation',
    'semiconductor',
    'space_technology',
    'quantum_computing',
    'biotechnology_emerging',
    'climate_tech',
    'electric_vehicles',
    'drone_technology_emerging',
    'ar_vr_xr',
    'blockchain_web3',
    'healthtech',
    'fintech_emerging',
    'creator_economy',
    'freelancing',
    'entrepreneurship_emerging',
  ],
};

/**
 * Maps catalog file identifiers to category_codes.
 */
export const CATALOG_TO_CATEGORY: Record<string, string> = {
  part_1_science: 'science',
  part_2_commerce: 'commerce',
  part_3_arts_humanities: 'arts_humanities',
  part_4_diploma: 'diploma',
  part_5_iti_polytechnic: 'iti_polytechnic',
  part_6_vocational: 'vocational',
  part_7_government_defence: 'government_defence',
  part_8_emerging_future: 'emerging_future',
};

/**
 * Get all sub_domain codes for a given category.
 */
export function getSubDomains(categoryCode: string): string[] {
  return TAXONOMY[categoryCode] || [];
}

/**
 * Validate that a sub_domain_code belongs to the given category.
 */
export function isValidSubDomain(
  categoryCode: string,
  subDomainCode: string,
): boolean {
  const domains = TAXONOMY[categoryCode];
  return !!domains && domains.includes(subDomainCode);
}
