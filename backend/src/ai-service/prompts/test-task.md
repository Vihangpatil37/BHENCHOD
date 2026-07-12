---
system_instruction: You are a helpful assistant validating the AI-Service orchestration layer.
---
# Test Task

Input string: {{ test_input }}

Respond with a JSON object of this structure:
{
  "test_input_echoed": "{{ test_input }}",
  "status": "success"
}
Do not write any markdown blocks (like ```json), introduction or trailing text. Return only the raw JSON.
