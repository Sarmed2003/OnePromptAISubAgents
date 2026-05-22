# Testing Guide

This guide explains how to run tests, add new tests, and perform manual quality assurance for the DinoLab web application.

## Running Tests

### Unit Tests

Run unit tests locally with:

```bash
npm test
```

This command runs all test files matching the `*.test.tsx` pattern using Jest. Tests run in watch mode by default, so they will re-run when you save changes.

To run tests once without watch mode:

```bash
npm test -- --no-coverage --watchAll=false
```

### Smoke Tests

Run smoke tests with:

```bash
npm run smoke-test
```

Smoke tests verify that the application builds and starts correctly. These tests check basic functionality and ensure the app is in a deployable state.

### Accessibility Tests

Run accessibility tests with:

```bash
npm test -- --testNamePattern=accessibility
```

Accessibility tests verify that the application meets WCAG standards and is usable with assistive technologies. These tests check keyboard navigation, screen reader compatibility, color contrast, and ARIA attributes.

## Test Files Overview

### `components.test.tsx`

Contains unit tests for React components. Tests in this file verify:
- Component rendering with various props
- User interactions (clicks, input changes)
- State updates and side effects
- Event handlers and callbacks
- Component lifecycle

Add component tests here when creating or modifying UI components.

### `accessibility.test.tsx`

Contains accessibility-specific tests. Tests in this file verify:
- Keyboard navigation and focus management
- ARIA labels and roles
- Screen reader announcements
- Color contrast ratios
- Semantic HTML structure

Add accessibility tests here when implementing new interactive features or when fixing accessibility issues.

### `setup.ts`

Contains test configuration and global setup. This file:
- Configures Jest and testing library
- Sets up global test utilities and mocks
- Defines custom matchers
- Initializes test environment variables
- Configures DOM polyfills if needed

Modify this file only when you need to add global test configuration or mocks that apply to all tests.

## Adding New Tests

### Step 1: Create or Update a Test File

If testing a component, add tests to `components.test.tsx`. If testing accessibility features, add tests to `accessibility.test.tsx`.

### Step 2: Write Your Test

Use the following template:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<YourComponent />);
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Step 3: Run Your Tests

Run the specific test file or use watch mode:

```bash
npm test -- YourComponent.test.tsx
```

### Step 4: Verify Coverage

Check that your tests cover the main code paths:

```bash
npm test -- --coverage
```

Aim for at least 80% coverage of new code.

## Manual QA Checklist

Before releasing, perform these manual tests:

### Dinosaur Interactions
- [ ] Click each dinosaur in the list
- [ ] Verify that clicking a dinosaur displays its details
- [ ] Verify that dinosaur images load correctly
- [ ] Verify that dinosaur descriptions are accurate and readable

### Layer Toggles
- [ ] Click each layer toggle button
- [ ] Verify that toggling layers shows/hides the correct content
- [ ] Verify that layer state persists when navigating away and back
- [ ] Verify that all layer combinations work together

### Bones and Descriptions
- [ ] Click on individual bones in the dinosaur visualization
- [ ] Verify that bone descriptions appear when clicked
- [ ] Verify that descriptions are clear and informative
- [ ] Verify that clicking another bone updates the description
- [ ] Verify that clicking the same bone again closes the description

### Keyboard Navigation
- [ ] Navigate through the app using only the Tab key
- [ ] Verify that focus is visible at all times
- [ ] Verify that all interactive elements are reachable via keyboard
- [ ] Use Enter/Space to activate buttons and links
- [ ] Use Arrow keys to navigate lists and menus
- [ ] Verify that focus order is logical and intuitive

### Mobile Testing
- [ ] Test on a mobile device or use browser dev tools (iPhone 12, Android)
- [ ] Verify that the layout is responsive and readable
- [ ] Verify that touch interactions work correctly
- [ ] Verify that buttons and interactive elements are large enough to tap
- [ ] Test in both portrait and landscape orientations
- [ ] Verify that all content is accessible without horizontal scrolling
- [ ] Test with mobile screen readers (VoiceOver on iOS, TalkBack on Android)

## Continuous Integration

Tests run automatically on pull requests. All tests must pass before merging:
- Unit tests must pass
- Smoke tests must pass
- Accessibility tests must pass
- Coverage must meet minimum thresholds

## Debugging Tests

### Debug a Single Test

Add `.only` to run a single test:

```typescript
it.only('should work', () => {
  // This test runs alone
});
```

### Skip a Test

Add `.skip` to skip a test:

```typescript
it.skip('should work', () => {
  // This test is skipped
});
```

### Use Debug Output

Use the `screen.debug()` function to see the rendered DOM:

```typescript
render(<YourComponent />);
screen.debug(); // Prints the DOM to console
```

### Run Tests with Verbose Output

```bash
npm test -- --verbose
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Keyboard Navigation Best Practices](https://www.w3.org/WAI/test-evaluate/)
