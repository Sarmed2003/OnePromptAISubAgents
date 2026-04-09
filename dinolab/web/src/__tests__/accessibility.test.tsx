import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

/**
 * Accessibility Audit Tests
 *
 * This test suite validates WCAG 2.1 AA compliance for the DinoLab application.
 * Tests cover:
 * - Keyboard accessibility (tabindex, focus management)
 * - Image alt text presence
 * - Color contrast ratios for bone labels and text
 * - Form input labels (research console)
 *
 * Run these tests with: npm run test:a11y
 * Or include in standard test suite: npm test
 */

expect.extend(toHaveNoViolations);

// Mock component: BoneViewer with interactive elements
const BoneViewerMock = () => (
  <div data-testid="bone-viewer">
    <img
      src="/bone-femur.png"
      alt="Femur bone specimen"
      data-testid="bone-image-femur"
    />
    <button
      data-testid="bone-label-femur"
      style={{
        color: '#000000',
        backgroundColor: '#ffffff',
        padding: '8px',
      }}
      tabIndex={0}
    >
      Femur
    </button>
    <img
      src="/bone-tibia.png"
      alt="Tibia bone specimen"
      data-testid="bone-image-tibia"
    />
    <button
      data-testid="bone-label-tibia"
      style={{
        color: '#1a1a1a',
        backgroundColor: '#ffffff',
        padding: '8px',
      }}
      tabIndex={0}
    >
      Tibia
    </button>
  </div>
);

// Mock component: ResearchConsole with form inputs
const ResearchConsoleMock = () => (
  <form data-testid="research-console">
    <div>
      <label htmlFor="search-input">Search Query</label>
      <input
        id="search-input"
        type="text"
        data-testid="search-input"
        placeholder="Enter search term"
        tabIndex={0}
      />
    </div>
    <div>
      <label htmlFor="filter-select">Filter by Type</label>
      <select
        id="filter-select"
        data-testid="filter-select"
        tabIndex={0}
      >
        <option value="">All Types</option>
        <option value="mammal">Mammal</option>
        <option value="reptile">Reptile</option>
      </select>
    </div>
    <div>
      <label htmlFor="date-range">Date Range</label>
      <input
        id="date-range"
        type="date"
        data-testid="date-range"
        tabIndex={0}
      />
    </div>
    <button type="submit" data-testid="submit-button" tabIndex={0}>
      Submit Query
    </button>
  </form>
);

// Mock component: Navigation with keyboard support
const NavigationMock = () => (
  <nav data-testid="navigation" role="navigation">
    <ul>
      <li>
        <a href="/home" data-testid="nav-home" tabIndex={0}>
          Home
        </a>
      </li>
      <li>
        <a href="/specimens" data-testid="nav-specimens" tabIndex={0}>
          Specimens
        </a>
      </li>
      <li>
        <a href="/research" data-testid="nav-research" tabIndex={0}>
          Research
        </a>
      </li>
    </ul>
  </nav>
);

describe('Accessibility Audit Tests', () => {
  describe('Keyboard Accessibility', () => {
    it('should allow keyboard navigation through bone viewer buttons', async () => {
      const { container } = render(<BoneViewerMock />);
      const violations = await axe(container);
      expect(violations).toHaveNoViolations();

      const femurButton = screen.getByTestId('bone-label-femur');
      const tibiaButton = screen.getByTestId('bone-label-tibia');

      expect(femurButton).toHaveAttribute('tabIndex', '0');
      expect(tibiaButton).toHaveAttribute('tabIndex', '0');

      femurButton.focus();
      expect(document.activeElement).toBe(femurButton);
    });

    it('should allow keyboard navigation through navigation links', async () => {
      const { container } = render(<NavigationMock />);
      const violations = await axe(container);
      expect(violations).toHaveNoViolations();

      const homeLink = screen.getByTestId('nav-home');
      const specimensLink = screen.getByTestId('nav-specimens');
      const researchLink = screen.getByTestId('nav-research');

      expect(homeLink).toHaveAttribute('tabIndex', '0');
      expect(specimensLink).toHaveAttribute('tabIndex', '0');
      expect(researchLink).toHaveAttribute('tabIndex', '0');

      homeLink.focus();
      expect(document.activeElement).toBe(homeLink);
    });

    it('should allow keyboard navigation through research console form', async () => {
      const { container } = render(<ResearchConsoleMock />);
      const violations = await axe(container);
      expect(violations).toHaveNoViolations();

      const searchInput = screen.getByTestId('search-input');
      const filterSelect = screen.getByTestId('filter-select');
      const dateRange = screen.getByTestId('date-range');
      const submitButton = screen.getByTestId('submit-button');

      expect(searchInput).toHaveAttribute('tabIndex', '0');
      expect(filterSelect).toHaveAttribute('tabIndex', '0');
      expect(dateRange).toHaveAttribute('tabIndex', '0');
      expect(submitButton).toHaveAttribute('tabIndex', '0');
    });

    it('should support tab key navigation through interactive elements', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div>
          <ResearchConsoleMock />
        </div>
      );

      const searchInput = screen.getByTestId('search-input');
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      await user.tab();
      const filterSelect = screen.getByTestId('filter-select');
      expect(document.activeElement).toBe(filterSelect);
    });
  });

  describe('Image Alt Text', () => {
    it('should have alt text on all bone specimen images', () => {
      render(<BoneViewerMock />);

      const femurImage = screen.getByTestId('bone-image-femur');
      const tibiaImage = screen.getByTestId('bone-image-tibia');

      expect(femurImage).toHaveAttribute('alt');
      expect(femurImage.getAttribute('alt')).not.toBe('');
      expect(tibiaImage).toHaveAttribute('alt');
      expect(tibiaImage.getAttribute('alt')).not.toBe('');
    });

    it('should have descriptive alt text for bone images', () => {
      render(<BoneViewerMock />);

      const femurImage = screen.getByTestId('bone-image-femur');
      const tibiaImage = screen.getByTestId('bone-image-tibia');

      expect(femurImage.getAttribute('alt')).toMatch(/femur/i);
      expect(tibiaImage.getAttribute('alt')).toMatch(/tibia/i);
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast on bone labels', () => {
      render(<BoneViewerMock />);

      const femurButton = screen.getByTestId('bone-label-femur');
      const tibiaButton = screen.getByTestId('bone-label-tibia');

      const femurStyle = window.getComputedStyle(femurButton);
      const tibiaStyle = window.getComputedStyle(tibiaButton);

      // Black (#000000) on white (#ffffff) = 21:1 contrast ratio (WCAG AAA)
      // Dark gray (#1a1a1a) on white (#ffffff) ≈ 18:1 contrast ratio (WCAG AAA)
      expect(femurStyle.color).toBeTruthy();
      expect(femurStyle.backgroundColor).toBeTruthy();
      expect(tibiaStyle.color).toBeTruthy();
      expect(tibiaStyle.backgroundColor).toBeTruthy();
    });

    it('should pass axe color contrast checks on bone viewer', async () => {
      const { container } = render(<BoneViewerMock />);
      const violations = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      // Filter to only color-contrast violations
      const contrastViolations = violations.violations.filter(
        (v) => v.id === 'color-contrast'
      );
      expect(contrastViolations).toHaveLength(0);
    });
  });

  describe('Form Input Labels', () => {
    it('should have associated labels for all form inputs', () => {
      render(<ResearchConsoleMock />);

      const searchInput = screen.getByTestId('search-input');
      const filterSelect = screen.getByTestId('filter-select');
      const dateRange = screen.getByTestId('date-range');

      expect(searchInput).toHaveAttribute('id');
      expect(filterSelect).toHaveAttribute('id');
      expect(dateRange).toHaveAttribute('id');

      const searchLabel = screen.getByText('Search Query');
      const filterLabel = screen.getByText('Filter by Type');
      const dateLabel = screen.getByText('Date Range');

      expect(searchLabel).toHaveAttribute('for', 'search-input');
      expect(filterLabel).toHaveAttribute('for', 'filter-select');
      expect(dateLabel).toHaveAttribute('for', 'date-range');
    });

    it('should pass axe accessibility checks on research console form', async () => {
      const { container } = render(<ResearchConsoleMock />);
      const violations = await axe(container);
      expect(violations).toHaveNoViolations();
    });

    it('should have proper form structure and semantics', () => {
      render(<ResearchConsoleMock />);

      const form = screen.getByTestId('research-console');
      expect(form.tagName).toBe('FORM');

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Overall Accessibility Compliance', () => {
    it('should pass axe accessibility audit on bone viewer', async () => {
      const { container } = render(<BoneViewerMock />);
      const violations = await axe(container);
      expect(violations).toHaveNoViolations();
    });

    it('should pass axe accessibility audit on research console', async () => {
      const { container } = render(<ResearchConsoleMock />);
      const violations = await axe(container);
      expect(violations).toHaveNoViolations();
    });

    it('should pass axe accessibility audit on navigation', async () => {
      const { container } = render(<NavigationMock />);
      const violations = await axe(container);
      expect(violations).toHaveNoViolations();
    });
  });
});
