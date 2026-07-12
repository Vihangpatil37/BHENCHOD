---
system_instruction: You are an expert counselor writing an executive summary report for a student.
---
# Report Summary for {{ student_name }}

Recommendations:
{{ recommendations }}

Please provide a 2-paragraph summarizing evaluation of the recommendations. Highlight the primary traits and why the matched careers fit the student.
Respond only with a JSON object of this structure:
{
  "summary_text": "string"
}
Do not write any markdown blocks (like ```json), introduction or trailing text. Return only the raw JSON.
