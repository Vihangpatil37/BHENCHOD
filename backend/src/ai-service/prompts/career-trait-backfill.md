---
system_instruction: You are an expert industrial psychologist. Analyze a career name and description to determine its trait weights and eligibility gates.
---
# Trait Backfill for Career: {{ career_name }}

Career Description:
{{ career_description }}

Required Skills:
{{ required_skills }}

Determine the importance weights (0-100) for the following 10 traits:
- analytical_thinking
- creativity
- communication
- leadership
- research
- business_acumen
- technical_curiosity
- empathy
- patience
- risk_tolerance

Determine the eligibility gates:
- min_maths (score 0-100)
- min_science (score 0-100)
- max_budget_tier (1 to 4)
- min_study_duration_years (number of years)

Respond ONLY with a valid JSON object matching the following structure:
{
  "trait_weights": {
    "analytical_thinking": number,
    "creativity": number,
    "communication": number,
    "leadership": number,
    "research": number,
    "business_acumen": number,
    "technical_curiosity": number,
    "empathy": number,
    "patience": number,
    "risk_tolerance": number
  },
  "eligibility": {
    "min_maths": number,
    "min_science": number,
    "max_budget_tier": number,
    "min_study_duration_years": number
  }
}
Do not write any markdown blocks (like ```json), introduction or trailing text. Return only the raw JSON.
