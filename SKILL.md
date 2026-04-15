# Superpowers Skill

## Purpose
This skill helps the agent work with the `obra/superpowers` repository and related workflows. It is intended for planning, explaining, extending, or refactoring features in the `superpowers` project.

## When to use
- The user asks for help implementing or reviewing code in `obra/superpowers`
- The user wants a reusable workflow for analyzing or generating enhancements for the repo
- The user asks to create documentation, tests, or examples for `superpowers`

## Behavior
1. Identify the repository structure, key packages, and runtime environment.
2. Summarize the user request into a concrete implementation plan.
3. Preserve existing style and architecture patterns from the repo.
4. Produce minimal, incremental changes with clear reasoning.
5. Ask for clarification only when the requested outcome is ambiguous.

## Quality criteria
- Deliver actionable outputs: code, docs, tests, or planning guidance
- Keep changes small and aligned with the user’s direct intent
- Avoid making broad architectural changes without explicit instructions
- Prefer standard TypeScript/JavaScript conventions and existing repository patterns

## Example prompts
- "Help me add a new superpowers command for generating prompts"
- "Explain the main workflow in `obra/superpowers` and propose a test strategy"
- "Refactor the superpowers CLI so commands are modular and easier to extend"

## Related customizations
- Add a repository-specific `copilot-instructions.md` pointing to the same style and workflow rules
- Create a `PROMPT.md` with common tasks for `superpowers` development and review
