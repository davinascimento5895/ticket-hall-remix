# GSD Skill

name: gsd
description: Use spec-driven, context-aware execution to build features with minimal ceremony and reliable verification. This skill is intended for project workflows that follow the GSD discuss → plan → execute → verify cycle.
license: MIT

## Purpose
This skill captures the philosophy of Get Shit Done (GSD): fast, reliable development with strong context engineering, automated plan verification, and small isolated tasks.

## When to use
- The user wants to build or extend a feature using autonomous planning and execution
- The user wants a workflow that emphasizes clear requirements, phase-level plans, and verification
- The user needs a lightweight, goal-oriented developer process without enterprise ceremony

## Behavior
1. Identify the user goal and the scope of the requested work.
2. Translate the request into a spec-driven task with clear requirements.
3. Use a minimal workflow: discuss context, plan the phase, execute atomic tasks, verify the results.
4. Prefer small, testable changes and keep git history clean with task-level commits.
5. Preserve existing repository conventions and avoid unnecessary complexity.

## Quality criteria
- Clear scope and deliverables
- Verification steps or acceptance criteria included
- Work broken into small, composable units
- Results aligned with the user's intent, not just implementation details
- No needless process overhead or overly broad architectural changes

## Example prompts
- "Create a phase plan for adding a responsive producer dashboard card"
- "Implement the UI and verification for event search filters"
- "Use a spec-driven workflow to add analytics tracking with minimal disruption"
