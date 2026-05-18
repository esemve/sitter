---
name: sitter-plan
description: Create a detailed implementation plan and task breakdown based on the active project vision.
---

# /sitter-plan

## Purpose

Generate a comprehensive implementation plan (`plan.md`) and a granular task list (`tasks.md`) for the active project, then present them to the user for review and iterative refinement.

## Preconditions

- A Sitter project MUST be active.
- The active project's `vision.md` MUST exist and contain clarified requirements.

## Instructions

1. **Retrieve the full vision.**
   Execute:
   ```
   sitter active-vision
   ```
   Capture the entire output (the contents of the active project's `vision.md`).

2. **Analyze and plan.**
   Based on the vision, create an implementation plan examining:
   - **Efficiency**: Is the approach optimal? Are there unnecessary steps?
   - **Patterns**: Are there existing patterns, libraries, or architectural conventions to follow?
   - **Risks**: What could go wrong during implementation?
   - **Security**: Are there authentication, authorization, data handling, or input validation concerns?
   - **Edge cases**: What scenarios might break the implementation?
   - **Dependencies**: What external libraries, APIs, or services are needed?
   - **Senior-level scrutiny**: Apply the same critical thinking a senior developer would.

3. **Resolve implementation questions.**
   - If you have ANY implementation questions, ask the user BEFORE writing the plan.
   - For each question, provide 2–3 solution options.
   - Explicitly state that the user can choose an option OR provide their own.
   - Repeat until you are completely confident in the plan.
   - The AI MUST communicate with the user in the same language the user is speaking.

4. **Write `plan.md`.**
   - Create or overwrite `sitter/projects/<PROJECT_NAME>/plan.md`.
   - Structure the plan with clear sections (Overview, Architecture, Risks & Mitigations, Security Considerations, etc.).
   - Use RFC 2119 keywords (MUST, SHOULD, MAY, SHALL) where appropriate.
   - **All markdown files MUST be written in English.**

5. **Write `tasks.md`.**
   - Create or overwrite `sitter/projects/<PROJECT_NAME>/tasks.md`.
   - Use the following Markdown format:

      ```markdown
      # TASKS: Project Name

      ## [ ] Task 1: Title of the task
      - [ ] Step description
      - [ ] Another step

      ## [ ] Task 2: Another task
      - [ ] Step description
      ```

    - The task heading MUST include a checkbox: `## [ ] Task N: Title` (e.g., `## [ ] Task 1: Create the core logic`).
   - Steps MUST use checklist syntax: `- [ ] description`.
   - When a task is complete, the title MUST be updated to `## [X] Task N: Title` (e.g., `## [X] Task 1: Create the core logic`).
    - Each task MUST:
      - Contain ALL details needed for an independent AI agent with zero prior context to understand and execute it correctly.
      - Be the smallest meaningfully committable unit of work.
      - Use RFC 2119 keywords (MUST, SHOULD, MAY, SHALL) for requirements.
    - **All markdown files MUST be written in English.**

6. **Present the plan and tasks to the user.**
   - Read `plan.md` and `tasks.md`.
   - Present the **complete, verbatim contents** of both files to the user. Copy the entire text of each file into your response without summarizing, paraphrasing, or condensing. The user MUST see every line exactly as it appears in the files.
   - Format the output using Markdown so it renders nicely: use a top-level heading for the file name, wrap each file's contents in a fenced code block with the `markdown` language identifier, and add clear visual separation between the two files.
   - Ask the user whether they would like any modifications.
   - The AI MUST communicate with the user in the same language the user is speaking.
   - The AI MUST NOT start `/sitter-implement` or `/sitter-yolo` on its own.

7. **Handle user modification requests.**
   If the user asks for changes, analyze whether the change affects the **foundations of the plan**:
   - A foundational change affects architecture, core scope, major components, or the overall approach (e.g., switching from REST to GraphQL, adding an entirely new module, changing the primary framework).
   - A superficial change affects task granularity, ordering, subtasks, wording, or minor additions that do not alter the plan's core structure.

   **If the change is foundational:**
   - Rewrite `plan.md` from scratch to reflect the new requirements.
   - Rewrite `tasks.md` from scratch based on the updated plan.
   - Return to step 6: present the updated files to the user and ask again for feedback.

   **If the change is superficial:**
   - Modify only `tasks.md` to incorporate the user's request (e.g., add a subtask, reorder steps, reword a task, split or merge tasks).
   - Leave `plan.md` unchanged.
   - Return to step 6: present the updated tasks to the user and ask again for feedback.

   **Repeat step 7 until the user confirms they are satisfied.**

8. **Confirm completion.**
   Only when the user explicitly indicates satisfaction with the plan and tasks:
   - Inform the user that the plan and tasks are ready.
   - Tell the user they can invoke `/sitter-implement` or `/sitter-yolo` to begin development.
   - Do NOT invoke either command automatically.

## Error Handling

- If `sitter active-vision` fails or returns no output, verify that a project is active and `vision.md` exists.
- If writing `plan.md` or `tasks.md` fails, report the exact filesystem error and retry once.
- If the vision is ambiguous, do NOT proceed to writing files until clarifications are obtained from the user.
