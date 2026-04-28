# Agents — AI Assistant Guidelines

## Context
This repo is Sebas.ai / Colleague-AI, a multi-tenant SaaS for AI-powered customer interaction.
Read PROJECT.md for stack and architecture. Read DECISIONS.md for rationale.

## Rules for AI agents working on this repo

1. **Don't break Firebase.** Legacy auth + Firestore still in use. Don't remove imports or deps until migration is complete.
2. **Supabase is the future DB.** Schema in supabase/migrations/. Types in src/types/database.ts. Client in src/lib/supabase.ts.
3. **Multi-channel architecture.** Never hardcode WhatsApp-only logic. Use channel_type enum everywhere.
4. **Don't touch server/pipeline/templates/infra** without explicit approval.
5. **Stitch screens are reference designs** in stitch_sebas.ai.../. Each has code.html + screen.png. Use as visual spec, don't copy code verbatim.
6. **No secrets in repo.** Use .env.local (gitignored). .env.example has the template.
7. **Spanish-first UI**, English code/comments.
8. **RLS is mandatory** for all multi-tenant tables. Test with different org contexts.

## File conventions
- Components: src/components/<feature>/<Component>.tsx
- Pages: src/pages/<Page>.tsx
- Lib: src/lib/<module>.ts
- Types: src/types/<domain>.ts
- Layouts: src/layouts/<Layout>.tsx
