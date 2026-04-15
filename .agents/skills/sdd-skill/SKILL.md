# Spec-Driven Development (SDD) Skill

name: sdd
description: This skill should be used when users want guidance on Spec-Driven Development methodology using GitHub's Spec-Kit. Guide users through executable specification workflows for both new projects (greenfield) and existing codebases (brownfield). After any SDD command generates artifacts, automatically provide structured 10-point summaries with feature status tracking, enabling natural language feature management and keeping users engaged throughout the process.
version: 2.1.0
author: Based on GitHub Spec-Kit by Den Delimarsky and John Lam
license: MIT

tags: [sdd, spec-driven, greenfield, brownfield]

## Purpose
This skill helps the agent guide users through Spec-Driven Development workflows that treat specifications as executable artifacts. It is designed for both new project creation and existing codebase modernization.

## When to use
- The user asks for spec-driven development guidance or workflows
- The user wants to initialize a new project with executable specifications
- The user wants to reverse-engineer or extend an existing codebase with SDD
- The user asks for feature status tracking, natural-language feature management, or structured summaries

## Behavior
1. Clarify whether the request is greenfield (new project) or brownfield (existing codebase).
2. Recommend installation and verification steps for `specify-cli` and supported agents.
3. Use a structured workflow: init → constitution → specify → plan → tasks → implement for greenfield, and analyze → reverse-engineer → specify → integration plan → tasks → implement for brownfield.
4. After generating artifacts, provide a 10-point structured summary with feature status and next-step options.
5. Support natural language feature operations, dependency checking, and progress dashboards.

## Quality criteria
- Workflow guidance is explicit and actionable
- Artifact changes are summarized clearly with rationale
- Feature progress and status are visible in every summary
- Recommendations are aligned with SDD concepts and existing codebase state
- Avoid vague or generic plan suggestions; prefer concrete next-step commands

## Example prompts
- "Use SDD to specify a new user authentication feature"
- "Reverse-engineer this existing codebase into Spec-Driven Development artifacts"
- "Show feature status and dependencies for my current SDD roadmap"
- "Add a new feature for email notifications and update the progress dashboard"
