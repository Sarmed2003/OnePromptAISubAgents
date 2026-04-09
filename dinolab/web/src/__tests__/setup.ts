import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// ============================================================================
// Type Definitions (inferred from component requirements)
// ============================================================================

interface Species {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  imageUrl: string;
}

interface Bone {
  id: string;
  name: string;
  speciesId: string;
  anatomyShapeId: string;
  details: string;
}

interface AnatomyShape {
  id: string;
  name: string;
  svgPath: string;
  boneIds: string[];
}

interface Layer {
  id: string;
  name: string;
  visible: boolean;
}

// ============================================================================
// Mock Data Factories
// ============================================================================

export function createMockSpecies(overrides?: Partial<Species>): Species {
  return {
    id: 'species-1',
    name: 'Triceratops',
    scientificName: 'Triceratops horridus',
    description: 'A large herbivorous ceratopsian dinosaur',
    imageUrl: 'https://example.com/triceratops.jpg',
    ...overrides,
  };
}

export function createMockBone(overrides?: Partial<Bone>): Bone {
  return {
    id: 'bone-1',
    name: 'Femur',
    speciesId: 'species-1',
    anatomyShapeId: 'shape-1',
    details: 'The thigh bone of the dinosaur',
    ...overrides,
  };
}

export function createMockAnatomyShape(
  overrides?: Partial<AnatomyShape>
): AnatomyShape {
  return {
    id: 'shape-1',
    name: 'Femur Shape',
    svgPath: 'M10,10 L20,20 L30,10 Z',
    boneIds: ['bone-1', 'bone-2'],
    ...overrides,
  };
}

export function createMockLayer(overrides?: Partial<Layer>): Layer {
  return {
    id: 'layer-1',
    name: 'Skeleton',
    visible: true,
    ...overrides,
  };
}

export function createMockSpeciesList(count: number = 3): Species[] {
  return Array.from({ length: count }, (_, i) => 
    createMockSpecies({
      id: `species-${i + 1}`,
      name: `Dinosaur ${i + 1}`,
      scientificName: `Dinosaurius ${i + 1}`,
    })
  );
}

export function createMockBoneList(count: number = 5): Bone[] {
  return Array.from({ length: count }, (_, i) => 
    createMockBone({
      id: `bone-${i + 1}`,
      name: `Bone ${i + 1}`,
    })
  );
}

export function createMockAnatomyShapeList(count: number = 3): AnatomyShape[] {
  return Array.from({ length: count }, (_, i) => 
    createMockAnatomyShape({
      id: `shape-${i + 1}`,
      name: `Shape ${i + 1}`,
      boneIds: [`bone-${i + 1}`],
    })
  );
}

export function createMockLayerList(count: number = 3): Layer[] {
  return Array.from({ length: count }, (_, i) => 
    createMockLayer({
      id: `layer-${i + 1}`,
      name: `Layer ${i + 1}`,
      visible: i === 0,
    })
  );
}

// ============================================================================
// Mock Hook Implementations
// ============================================================================

export const mockUseAgentAsk = vi.fn((query: string) => ({
  data: null,
  loading: false,
  error: null,
}));

export const mockUseSpecies = vi.fn(() => ({
  species: createMockSpeciesList(3),
  loading: false,
  error: null,
}));

export const mockUseBones = vi.fn((speciesId: string) => ({
  bones: createMockBoneList(5),
  loading: false,
  error: null,
}));

export const mockUseAnatomyShapes = vi.fn(() => ({
  shapes: createMockAnatomyShapeList(3),
  loading: false,
  error: null,
}));

export const mockUseLayers = vi.fn(() => ({
  layers: createMockLayerList(3),
  setLayers: vi.fn(),
}));

export const mockUseSelectedBone = vi.fn(() => ({
  selectedBone: null,
  setSelectedBone: vi.fn(),
}));

export const mockUseTheme = vi.fn(() => ({
  theme: 'light',
  toggleTheme: vi.fn(),
}));

// ============================================================================
// Test Utilities
// ============================================================================

export function queryBoneByName(
  container: HTMLElement,
  boneName: string
): HTMLElement | null {
  return container.querySelector(`[data-testid="bone-${boneName}"]`);
}

export function queryBonesBySpecies(
  container: HTMLElement,
  speciesId: string
): HTMLElement[] {
  return Array.from(
    container.querySelectorAll(`[data-species-id="${speciesId}"]`)
  );
}

export function toggleLayerVisibility(
  container: HTMLElement,
  layerId: string
): void {
  const checkbox = container.querySelector(
    `input[data-testid="layer-toggle-${layerId}"]`
  ) as HTMLInputElement;
  if (checkbox) {
    checkbox.click();
  }
}

export function getVisibleLayers(container: HTMLElement): string[] {
  const visibleCheckboxes = Array.from(
    container.querySelectorAll('input[data-testid^="layer-toggle-"]:checked')
  );
  return visibleCheckboxes.map((checkbox) => {
    const testId = (checkbox as HTMLElement).getAttribute('data-testid') || '';
    return testId.replace('layer-toggle-', '');
  });
}

export function getBoneDetails(container: HTMLElement): string {
  const detailPanel = container.querySelector('[data-testid="bone-detail-panel"]');
  return detailPanel?.textContent || '';
}

export function selectBone(
  container: HTMLElement,
  boneId: string
): void {
  const boneElement = container.querySelector(
    `[data-testid="bone-${boneId}"]`
  ) as HTMLElement;
  if (boneElement) {
    boneElement.click();
  }
}

export function getSpeciesListItems(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll('[data-testid^="species-item-"]')
  );
}

export function selectSpecies(
  container: HTMLElement,
  speciesId: string
): void {
  const speciesElement = container.querySelector(
    `[data-testid="species-item-${speciesId}"]`
  ) as HTMLElement;
  if (speciesElement) {
    speciesElement.click();
  }
}

// ============================================================================
// Test Provider Wrapper
// ============================================================================

interface TestProviderProps {
  children: ReactNode;
  theme?: string;
  initialLayers?: Layer[];
}

function TestProvider({ children, theme = 'light', initialLayers }: TestProviderProps) {
  return <>{children}</>;
}

// ============================================================================
// Custom Render Function
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: string;
  initialLayers?: Layer[];
}

export function renderWithProviders(
  ui: ReactNode,
  {
    theme = 'light',
    initialLayers = createMockLayerList(3),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestProvider theme={theme} initialLayers={initialLayers}>
        {children}
      </TestProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    // Additional utilities
    queryBoneByName: (boneName: string) => {
      const container = document.querySelector('[data-testid="test-container"]');
      return container ? queryBoneByName(container, boneName) : null;
    },
    toggleLayer: (layerId: string) => {
      const container = document.querySelector('[data-testid="test-container"]');
      if (container) toggleLayerVisibility(container, layerId);
    },
    selectBone: (boneId: string) => {
      const container = document.querySelector('[data-testid="test-container"]');
      if (container) selectBone(container, boneId);
    },
  };
}

// ============================================================================
// Vitest Configuration Helpers
// ============================================================================

export const vitestConfig = {
  environment: 'jsdom',
  globals: true,
  setupFiles: [],
};

// ============================================================================
// Global Test Setup
// ============================================================================

export function setupTestEnvironment(): void {
  // Mock window.matchMedia if needed
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export { render, screen, waitFor, fireEvent } from '@testing-library/react';
export { vi } from 'vitest';
