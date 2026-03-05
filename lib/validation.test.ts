import {
  containsSqlInjection,
  isBlank,
  normaliseEmail,
  sanitiseInput,
  trimInput,
  validateDisplayName,
  validateEmail,
  validateNoSqlInjection,
  validatePassword,
  validateRequired,
  validateResetPasswordFields,
  validateSignInFields,
  validateSignUpFields,
} from './validation';

describe('isBlank', () => {
  test('returns true for null', () => {
    expect(isBlank(null)).toBe(true);
  });

  test('returns true for undefined', () => {
    expect(isBlank(undefined)).toBe(true);
  });

  test('returns true for empty string', () => {
    expect(isBlank('')).toBe(true);
  });

  test('returns true for whitespace only', () => {
    expect(isBlank('   ')).toBe(true);
    expect(isBlank('\t')).toBe(true);
    expect(isBlank('\n')).toBe(true);
  });

  test('returns false for non-empty string', () => {
    expect(isBlank('hello')).toBe(false);
    expect(isBlank('  hello  ')).toBe(false);
  });
});

describe('trimInput', () => {
  test('removes leading whitespace', () => {
    expect(trimInput('  hello')).toBe('hello');
  });

  test('removes trailing whitespace', () => {
    expect(trimInput('hello  ')).toBe('hello');
  });

  test('removes both leading and trailing whitespace', () => {
    expect(trimInput('  hello  ')).toBe('hello');
  });

  test('preserves internal whitespace', () => {
    expect(trimInput('  hello world  ')).toBe('hello world');
  });

  test('returns empty string for whitespace only', () => {
    expect(trimInput('   ')).toBe('');
  });
});

describe('containsSqlInjection', () => {
  // Should detect SQL injection patterns
  test('detects OR 1=1 injection', () => {
    expect(containsSqlInjection("' OR 1=1")).toBe(true);
    expect(containsSqlInjection("'OR 1=1")).toBe(true);
    expect(containsSqlInjection("' or 1=1")).toBe(true);
  });

  test('detects OR string comparison injection', () => {
    expect(containsSqlInjection("' OR 'a'='a'")).toBe(true);
    expect(containsSqlInjection("' OR 'x'='x")).toBe(true);
  });

  test('detects DROP TABLE injection', () => {
    expect(containsSqlInjection('; DROP TABLE users')).toBe(true);
    expect(containsSqlInjection(';DROP TABLE users')).toBe(true);
  });

  test('detects DELETE FROM injection', () => {
    expect(containsSqlInjection('; DELETE FROM users')).toBe(true);
  });

  test('detects INSERT INTO injection', () => {
    expect(containsSqlInjection('; INSERT INTO users')).toBe(true);
  });

  test('detects UPDATE SET injection', () => {
    expect(containsSqlInjection('; UPDATE users SET admin=1')).toBe(true);
  });

  test('detects SQL comments (--)', () => {
    expect(containsSqlInjection('admin--')).toBe(true);
    expect(containsSqlInjection('; -- comment')).toBe(true);
  });

  test('detects block comments', () => {
    expect(containsSqlInjection('/* comment */')).toBe(true);
  });

  test('detects UNION SELECT injection', () => {
    expect(containsSqlInjection('UNION SELECT * FROM users')).toBe(true);
    expect(containsSqlInjection('union select password')).toBe(true);
  });

  test('detects EXEC injection', () => {
    expect(containsSqlInjection('EXEC sp_executesql')).toBe(true);
    expect(containsSqlInjection('EXEC(')).toBe(true);
  });

  test('detects xp_ stored procedures', () => {
    expect(containsSqlInjection('xp_cmdshell')).toBe(true);
  });

  test('detects hex values', () => {
    expect(containsSqlInjection('0x41424344')).toBe(true);
  });

  test('detects CHAR() function', () => {
    expect(containsSqlInjection('CHAR(65)')).toBe(true);
  });

  test('detects CONCAT() function', () => {
    expect(containsSqlInjection('CONCAT(a,b)')).toBe(true);
  });

  test('detects semicolon after quote', () => {
    expect(containsSqlInjection("' ; SELECT")).toBe(true);
  });

  // Should NOT detect valid inputs
  test('allows normal text', () => {
    expect(containsSqlInjection('John Smith')).toBe(false);
    expect(containsSqlInjection('hello@example.com')).toBe(false);
  });

  test('allows numbers', () => {
    expect(containsSqlInjection('12345')).toBe(false);
  });
});

describe('sanitiseInput', () => {
  test('removes single quotes', () => {
    expect(sanitiseInput("test'value")).toBe('testvalue');
  });

  test('removes double quotes', () => {
    expect(sanitiseInput('test"value')).toBe('testvalue');
  });

  test('removes backslashes', () => {
    expect(sanitiseInput('test\\value')).toBe('testvalue');
  });

  test('removes semicolons', () => {
    expect(sanitiseInput('test;value')).toBe('testvalue');
  });

  test('removes SQL comment dashes', () => {
    expect(sanitiseInput('test--value')).toBe('testvalue');
  });

  test('removes block comment start', () => {
    expect(sanitiseInput('test/*value')).toBe('testvalue');
  });

  test('removes block comment end', () => {
    expect(sanitiseInput('test*/value')).toBe('testvalue');
  });

  test('trims whitespace', () => {
    expect(sanitiseInput('  test  ')).toBe('test');
  });

  test('handles multiple dangerous characters', () => {
    expect(sanitiseInput("'; DROP TABLE--")).toBe('DROP TABLE');
  });
});

describe('validateRequired', () => {
  test('fails for empty string', () => {
    const result = validateRequired('', 'Username');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Username is required.');
  });

  test('fails for whitespace only', () => {
    const result = validateRequired('   ', 'Username');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Username is required.');
  });

  test('passes for non-empty string', () => {
    const result = validateRequired('john', 'Username');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('uses provided field name in error', () => {
    const result = validateRequired('', 'Email address');
    expect(result.error).toBe('Email address is required.');
  });
});

describe('validateNoSqlInjection', () => {
  test('fails for SQL injection attempt', () => {
    const result = validateNoSqlInjection("' OR 1=1", 'Username');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Username contains invalid characters.');
  });

  test('passes for clean input', () => {
    const result = validateNoSqlInjection('John Smith', 'Username');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('validateDisplayName', () => {
  // Required check
  test('fails for empty string', () => {
    const result = validateDisplayName('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Display name is required.');
  });

  test('fails for whitespace only', () => {
    const result = validateDisplayName('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Display name is required.');
  });

  // SQL injection check
  test('fails for SQL injection attempt', () => {
    const result = validateDisplayName("'; DROP TABLE users--");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Display name contains invalid characters.');
  });

  // Length checks
  test('fails for name shorter than 3 characters', () => {
    const result = validateDisplayName('Ab');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Display name must be at least 3 characters.');
  });

  test('fails for name longer than 32 characters', () => {
    const result = validateDisplayName('A'.repeat(33));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Display name must be no more than 32 characters.');
  });

  // Character checks
  test('fails for name with numbers', () => {
    const result = validateDisplayName('John123');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(
      'Display name must contain letters only (no numbers or special characters).',
    );
  });

  test('fails for name with special characters', () => {
    const result = validateDisplayName('John@Smith');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(
      'Display name must contain letters only (no numbers or special characters).',
    );
  });

  // Valid cases
  test('passes for valid name with letters only', () => {
    const result = validateDisplayName('John');
    expect(result.isValid).toBe(true);
  });

  test('passes for valid name with spaces', () => {
    const result = validateDisplayName('John Smith');
    expect(result.isValid).toBe(true);
  });

  test('passes for minimum length (3 chars)', () => {
    const result = validateDisplayName('Jon');
    expect(result.isValid).toBe(true);
  });

  test('passes for maximum length (32 chars)', () => {
    const result = validateDisplayName('A'.repeat(32));
    expect(result.isValid).toBe(true);
  });
});

describe('validateEmail', () => {
  // Required check
  test('fails for empty string', () => {
    const result = validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email address is required.');
  });

  // SQL injection check
  test('fails for SQL injection attempt', () => {
    const result = validateEmail("test' OR 1=1@example.com");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email address contains invalid characters.');
  });

  // Space check
  test('fails for email with spaces', () => {
    const result = validateEmail('test @example.com');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email address cannot contain spaces.');
  });

  // Length checks
  test('fails for email shorter than 5 characters', () => {
    const result = validateEmail('a@b');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email address must be at least 5 characters.');
  });

  test('fails for email longer than 254 characters', () => {
    const result = validateEmail('a'.repeat(250) + '@b.com');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email address must be no more than 254 characters.');
  });

  // @ symbol checks
  test('fails for email without @', () => {
    const result = validateEmail('testexample.com');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email address must contain exactly one "@" symbol.');
  });

  test('fails for email with multiple @', () => {
    const result = validateEmail('test@@example.com');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email address must contain exactly one "@" symbol.');
  });

  // Dot after @ check
  test('fails for email without dot after @', () => {
    const result = validateEmail('test@examplecom');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email address must contain a "." after the "@" symbol.');
  });

  // Valid cases
  test('passes for valid email', () => {
    const result = validateEmail('test@example.com');
    expect(result.isValid).toBe(true);
  });

  test('passes for email with subdomain', () => {
    const result = validateEmail('test@mail.example.com');
    expect(result.isValid).toBe(true);
  });

  test('passes for email with plus sign', () => {
    const result = validateEmail('test+tag@example.com');
    expect(result.isValid).toBe(true);
  });

  test('passes for email with dots in local part', () => {
    const result = validateEmail('first.last@example.com');
    expect(result.isValid).toBe(true);
  });

  test('trims whitespace before validation', () => {
    const result = validateEmail('  test@example.com  ');
    expect(result.isValid).toBe(true);
  });
});

describe('normaliseEmail', () => {
  test('converts to lowercase', () => {
    expect(normaliseEmail('Test@Example.COM')).toBe('test@example.com');
  });

  test('trims whitespace', () => {
    expect(normaliseEmail('  test@example.com  ')).toBe('test@example.com');
  });

  test('trims and lowercases together', () => {
    expect(normaliseEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
  });
});

describe('validatePassword', () => {
  // Required check
  test('fails for empty string', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password is required.');
  });

  // SQL injection check
  test('fails for SQL injection attempt', () => {
    const result = validatePassword("Pass1!' OR 1=1");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password contains invalid characters.');
  });

  // Length checks
  test('fails for password shorter than 6 characters', () => {
    const result = validatePassword('Aa1!');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must be at least 6 characters.');
  });

  test('fails for password longer than 100 characters', () => {
    const result = validatePassword('Aa1!' + 'a'.repeat(100));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must be no more than 100 characters.');
  });

  // Character requirement checks
  test('fails for password without uppercase letter', () => {
    const result = validatePassword('password1!');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must contain at least 1 uppercase letter.');
  });

  test('fails for password without lowercase letter', () => {
    const result = validatePassword('PASSWORD1!');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must contain at least 1 lowercase letter.');
  });

  test('fails for password without number', () => {
    const result = validatePassword('Password!');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must contain at least 1 number.');
  });

  test('fails for password without symbol', () => {
    const result = validatePassword('Password1');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must contain at least 1 symbol.');
  });

  // Valid cases
  test('passes for valid password', () => {
    const result = validatePassword('Password1!');
    expect(result.isValid).toBe(true);
  });

  test('passes for password with various symbols', () => {
    expect(validatePassword('Password1@').isValid).toBe(true);
    expect(validatePassword('Password1#').isValid).toBe(true);
    expect(validatePassword('Password1$').isValid).toBe(true);
    expect(validatePassword('Password1%').isValid).toBe(true);
    expect(validatePassword('Password1^').isValid).toBe(true);
    expect(validatePassword('Password1&').isValid).toBe(true);
    expect(validatePassword('Password1*').isValid).toBe(true);
  });

  test('passes for minimum length password (6 chars)', () => {
    const result = validatePassword('Pa1!aa');
    expect(result.isValid).toBe(true);
  });

  test('passes for maximum length password (100 chars)', () => {
    const result = validatePassword('Aa1!' + 'a'.repeat(96));
    expect(result.isValid).toBe(true);
  });
});

describe('validateSignInFields', () => {
  test('fails for invalid email', () => {
    const result = validateSignInFields('invalid-email', 'Password1!');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email address must contain exactly one "@" symbol.');
  });

  test('fails for empty password', () => {
    const result = validateSignInFields('test@example.com', '');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password is required.');
  });

  test('passes with valid email and any non-empty password', () => {
    // Sign-in only requires password to be present, not fully validated
    const result = validateSignInFields('test@example.com', 'weak');
    expect(result.isValid).toBe(true);
  });

  test('passes with valid credentials', () => {
    const result = validateSignInFields('test@example.com', 'Password1!');
    expect(result.isValid).toBe(true);
  });
});

describe('validateSignUpFields', () => {
  test('fails for invalid email', () => {
    const result = validateSignUpFields('invalid-email', 'Password1!');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email address must contain exactly one "@" symbol.');
  });

  test('fails for weak password (no uppercase)', () => {
    const result = validateSignUpFields('test@example.com', 'password1!');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must contain at least 1 uppercase letter.');
  });

  test('fails for weak password (no symbol)', () => {
    const result = validateSignUpFields('test@example.com', 'Password1');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must contain at least 1 symbol.');
  });

  test('passes with valid email and strong password', () => {
    const result = validateSignUpFields('test@example.com', 'Password1!');
    expect(result.isValid).toBe(true);
  });
});

describe('validateResetPasswordFields', () => {
  test('fails for empty email', () => {
    const result = validateResetPasswordFields('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email address is required.');
  });

  test('fails for invalid email', () => {
    const result = validateResetPasswordFields('invalid-email');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email address must contain exactly one "@" symbol.');
  });

  test('passes for valid email', () => {
    const result = validateResetPasswordFields('test@example.com');
    expect(result.isValid).toBe(true);
  });
});
