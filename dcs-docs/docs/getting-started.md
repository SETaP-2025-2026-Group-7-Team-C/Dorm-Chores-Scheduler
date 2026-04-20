# Getting Started

Welcome to the Dorm Chores Scheduler project! This guide will help you set up, run, and understand the basics of the project.

## Overview

Dorm Chores Scheduler is an application designed to help manage and schedule chores in a dormitory environment. It supports different user roles (students, managers), chore analytics, notifications, and more.

## Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- Expo CLI (for React Native development)
- A code editor (VS Code recommended)

## Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd Dorm-Chores-Scheduler
   ```
2. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```
3. **Install Expo CLI (if not already installed):**
   ```sh
   npm install -g expo-cli
   ```

## Running the App

1. **Start the development server:**
   ```sh
   npx expo start
   ```
2. **Open the app:**
   - Use the Expo Go app on your mobile device to scan the QR code.
   - Or run on an emulator/simulator.

## Project Structure

- `app/` - Main application code (pages, navigation, authentication, main features)
- `components/` - Reusable UI components
- `lib/` - Business logic, utilities, and API integrations
- `constants/` - Shared constants (e.g., colors)
- `assets/` - Images and static assets
- `database/` - SQL files for database schema and reference data
- `dcs-docs/` - Project documentation

## Testing

- UI tests are located in `app/ui-tests/`
- Unit and integration tests are in `lib/` (files ending with `.test.ts`)
- Run tests with:
  ```sh
  npm test
  ```

## Linting & Formatting

This project enforces code quality and style using ESLint and Prettier. Consistent linting and formatting help keep the codebase clean and reduce bugs.

### Linting Setup

- **ESLint** is configured with Expo and Prettier integrations (see `eslint.config.js`).
- **Prettier** is used for code formatting (see `.prettierrc`).
- Linting and formatting are automatically run on staged files before commits using Husky and lint-staged.

**Common commands:**

- `npm run lint` - Check for lint issues
- `npm run lint:fix` - Auto-fix lint issues
- `npm run format` - Check formatting
- `npm run format:fix` - Auto-format code
- `npm run typecheck` - TypeScript type checking

### Recommended VS Code Extensions

For the best experience, install these extensions (see `.vscode/extensions.json`):

- [Expo Tools](https://marketplace.visualstudio.com/items?itemName=expo.vscode-expo-tools)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

The workspace also sets up format-on-save and organizes imports (see `.vscode/settings.json`).

### Relevant Files

- `eslint.config.js` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `.vscode/extensions.json` - Recommended extensions
- `.vscode/settings.json` - Editor settings for formatting and linting
- `package.json` - Lint/typecheck scripts and lint-staged config

**Tip:** Always lint and format your code before pushing or opening a pull request.
