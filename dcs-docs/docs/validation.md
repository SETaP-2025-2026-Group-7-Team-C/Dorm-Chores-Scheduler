# Validation System

## Overview

The validation system is responsible for checking user input before it is submitted or processed. Its purpose is to improve data quality, reduce user error, and protect the system from unsafe or malicious input.

According to the project task, the validation documentation should cover:

- Core functions
- Field validators
- Form-level validation
- SQL injection detection rules
- Test coverage in `validation.test.ts`

---

## Core Validation Functions

### `isBlank`

Checks whether a value is empty or contains only whitespace.

**Purpose:**  
Used to detect empty fields before form submission.

---

### `trimInput`

Removes leading and trailing whitespace from user input.

**Purpose:**  
Improves consistency and prevents accidental spaces from breaking validation.

---

### `sanitiseInput`

Cleans input before validation or submission.

**Purpose:**  
Reduces the risk of invalid formatting and unsafe characters entering the system.

---

### `containsSqlInjection`

Checks whether an input string contains suspicious SQL injection patterns.

**Purpose:**  
Protects the system by detecting malicious input such as SQL keywords, comment sequences, or injected conditions.

---

## Field Validators

### `validateRequired`

Checks that a field has a non-empty value.

**Typical use:**  
Required fields such as email, display name, and password.

---

### `validateNoSqlInjection`

Checks that the input does not contain SQL injection patterns.

**Typical use:**  
Applied to user-entered text before form submission.

---

### `validateDisplayName`

Checks whether the display name matches the required format.

**Typical checks may include:**

- minimum or maximum length
- allowed characters
- no blank-only values

---

### `validateEmail`

Checks whether the email address is in a valid format.

**Typical checks may include:**

- contains `@`
- contains a valid domain structure
- rejects clearly invalid formatting

---

### `normaliseEmail`

Converts email input into a standard format.

**Typical behaviour:**

- trims whitespace
- converts to lowercase

**Purpose:**  
Ensures that emails are stored and compared consistently.

---

### `validatePassword`

Checks whether the password meets the project rules.

**Typical checks may include:**

- minimum length
- required character types
- invalid or unsafe patterns

---

## Form-Level Validation

### `validateSignInFields`

Validates all fields required for the sign-in form.

**Expected fields:**

- email
- password

**Purpose:**  
Prevents incomplete or unsafe sign-in requests.

---

### `validateSignUpFields`

Validates all fields required for the sign-up form.

**Expected fields:**

- display name
- email
- password

**Purpose:**  
Ensures user registration data is complete, valid, and safe.

---

### `validateResetPasswordFields`

Validates all fields required for the reset password flow.

**Expected fields may include:**

- email
- code
- new password

**Purpose:**  
Ensures password reset requests are correctly structured before submission.

---

## SQL Injection Detection Rules

The validation system is also expected to reject suspicious input that looks like an SQL injection attempt.

### Common patterns to detect

Examples of suspicious patterns include:

### Purpose

These checks help prevent users from entering strings that may later be interpreted as executable SQL or otherwise unsafe input.

```

## Test Coverage

Validation behaviour should be covered in `validation.test.ts`.

### Tests should confirm:

- blank values are rejected where required
- trimming and sanitisation work correctly
- valid emails are accepted
- invalid emails are rejected
- valid passwords are accepted
- invalid passwords are rejected
- SQL injection patterns are detected
- form-level validation returns the expected results

### Why test coverage matters

Validation is a high-risk area because small mistakes can lead to:

- poor user experience
- broken authentication flows
- unsafe input being accepted

Testing helps ensure the validation logic is reliable and behaves consistently.

---

## Documentation Note

If new validation rules are added later, this file should be updated so contributors can clearly understand:

- what each validator checks
- where each validator is used
- which forms depend on it
- which tests verify it
```
