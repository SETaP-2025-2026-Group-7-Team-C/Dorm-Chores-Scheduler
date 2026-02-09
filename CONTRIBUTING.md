# Contributing to Dorm Chores Scheduler

Dorm Chores Scheduler is a university group project developed by certified members of Group 7 (Team C).

Because this work is part of assessed university coursework, contributions are strictly limited to approved group members only.

## Who Can Contribute?

Only the following certified group members may contribute code, documentation, issues, or pull requests.

## Project Members

- **UP2278660** – [Lpc795](https://github.com/Lpc795).
- **UP2271413** – [tristanbudd](https://github.com/tristanbudd).
- **UP2121194** – [up2121194-web](https://github.com/up2121194-web).
- **UP2298691** – [TenkaTosic](https://github.com/TenkaTosic).
- **UP2271299** – [Ebrown21-commits](https://github.com/Ebrown21-commits).
- **UP2307850** – [240905Ce1](https://github.com/240905Ce1).
- **UP2247172** – [neda-payam](https://github.com/neda-payam).

If you are not listed above, please do not submit pull requests or attempt to push changes.

## Allowed Contribution Types

Certified group members may contribute through.

- Opening and resolving issues.
- Submitting pull requests.
- Reviewing pull requests.
- Improving documentation.
- Testing and reporting bugs.

## Contribution Workflow

All changes must follow this workflow.

1. Create a new branch for your work.
2. Make your changes.
3. Ensure the app still builds and runs successfully.
4. Open a pull request into `main`.
5. Request review from at least one other group member.

## Code Style

This project uses ESLint to enforce consistent formatting and code quality.

All contributors must ensure ESLint passes before opening or merging a pull request.

TypeScript naming conventions should follow standard TypeScript / JavaScript practices.

- Use `camelCase` for variables, functions, parameters, and file-local constants.
- Use `PascalCase` for React components, classes, types, and interfaces.
- Use `UPPER_SNAKE_CASE` for true constants (e.g. `const MAX_USERS = 100;`).
- Use `kebab-case` for file and folder names (e.g App Example = app-example.tsx).

Contributors should also:

- Prefer TypeScript types over `any`.
- Keep functions small and readable.
- Avoid duplicated logic when possible.
- Add comments only when the code is not self-explanatory.

## Pull Requests

All code changes must be made through pull requests.

A pull request may only be merged when all of the following conditions are met.

- The pull request has been reviewed by at least one other certified group member.
- All automated GitHub Actions checks have passed successfully.
- The author has tested the changes locally before requesting review (where applicable).
- The reviewer has also tested the changes locally (where applicable), especially for UI changes, logic changes, or new features.

Pull requests should remain small and focused whenever possible.

If a pull request is large, the author should clearly describe what changed and why.

## Testing

Testing is required for any change that could affect functionality, UI behaviour, navigation, storage, or scheduling logic.

Before marking a pull request as ready for review, contributors must.

- Run the project locally and confirm it starts successfully.
- Test the feature or fix manually in the app (if applicable).
- Confirm no existing features appear broken.
- Ensure the branch passes all automated GitHub Actions checks.

Reviewers should also:

- Pull the branch locally (if applicable).
- Confirm the feature works as described.
- Confirm nothing obvious is broken before approving.

## Reporting Bugs

Bugs should be reported via GitHub Issues by certified group members only.

When reporting a bug, include.

- What happened.
- What you expected to happen.
- Steps to reproduce.
- Screenshots (if relevant).
- Device / OS information (if relevant).

## External Contributions

This repository is public for visibility and coursework purposes, but external contributions are not accepted.

If you are an external viewer and want to provide feedback, please contact a project member directly instead of opening issues or pull requests.
