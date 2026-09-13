# LCSD Swim Availability

This project is a small notification service for Hong Kong public swimming pools managed by the Leisure and Cultural Services Department (LCSD).

The first use case is notifying a swimmer when Victoria Park or Morrison Hill Swimming Pool has a closure, competition, maintenance period, or other event that overlaps with the swimmer's plans.

## Context

Read these files at the start of a new session:

1. `PROJECT_CONTEXT.md` - product goals, requirements, source behavior, and MVP scope.
2. `ARCHITECTURE.md` - PWA, Web Push, polling, parsing, storage, and deployment model.
3. `DECISIONS.md` - implementation decisions and constraints.
4. `DELIVERY_PLAN.md` - three-day scope, testing strategy, and final setup sequence.
5. `SETUP.md` - local setup, Supabase, Vercel, push testing, and scheduler setup.

## Current Status

The birthday MVP is scaffolded. It includes the PWA, configuration-driven pool list, LCSD temporary-closure parser, daily summary route, Web Push subscription flow, Supabase schema, and GitHub Actions schedule. Hosting and external service credentials still need to be configured.
