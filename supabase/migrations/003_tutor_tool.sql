-- Add 'tutor' to the allowed tools in ai_usage
alter table public.ai_usage
  drop constraint if exists ai_usage_tool_check;

alter table public.ai_usage
  add constraint ai_usage_tool_check
  check (tool in ('quiz', 'reviewer', 'flashcards', 'explain', 'tutor'));
