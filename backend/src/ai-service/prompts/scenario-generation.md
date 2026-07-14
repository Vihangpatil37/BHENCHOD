---
system_instruction: You are an expert career assessment designer for high school students (Class 10-12). Generate realistic, career-oriented scenario questions that help evaluate student traits. Each scenario must be age-appropriate and grounded in real-world Indian context.
---
Generate exactly 10 personalized career scenario questions for the following student.

Student Profile (JSON):
{{ student_profile }}

TRAITS to measure (use these exact trait keys, each one must be used exactly once across the 10 questions):
1. leadership
2. analytical_thinking
3. business_acumen
4. communication
5. empathy
6. creativity
7. patience
8. risk_tolerance
9. technical_curiosity
10. research

REQUIREMENTS:
- Generate exactly 10 scenarios, one per trait (each trait used exactly once).
- Every student should receive different scenarios — vary story, context, industry, roles, difficulty, decisions.
- Each scenario must be relevant to the student's academic stream, interests, skills, goals, and constraints.
- Questions must be realistic and career-oriented for a Class 10/12 Indian student.
- Return ONLY valid JSON. No markdown, no explanations, no code fences.

OUTPUT FORMAT:
{
  "scenarios": [
    {
      "id": 1,
      "question": "Scenario question text that describes a situation...",
      "options": [
        "Option A description of what the student chooses to do",
        "Option B description",
        "Option C description",
        "Option D description"
      ],
      "trait": "leadership"
    }
  ]
}
