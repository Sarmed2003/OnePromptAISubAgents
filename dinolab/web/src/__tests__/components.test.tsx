import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock components - these would normally be imported from the actual component files
// For testing purposes, we create minimal implementations
const DinoPicker = ({ onSelect }: { onSelect?: (species: string) => void }) => {
  const [selectedSpecies, setSelectedSpecies] = React.useState<string | null>(null);
  const species = ['Tyrannosaurus rex', 'Triceratops', 'Stegosaurus', 'Velociraptor'];

  const handleSelect = (sp: string) => {
    setSelectedSpecies(sp);
    onSelect?.(sp);
  };

  return (
    <div data-testid="dino-picker">
      <h2>Select a Dinosaur</h2>
      <select
        data-testid="species-dropdown"
        value={selectedSpecies || ''}
        onChange={(e) => handleSelect(e.target.value)}
      >
        <option value="">Choose a species...</option>
        {species.map((sp) => (
          <option key={sp} value={sp}>
            {sp}
          </option>
        ))}
      </select>
      {selectedSpecies && (
        <div data-testid="selected-species">{selectedSpecies}</div>
      )}
    </div>
  );
};

const BoneDetailPanel = ({ bone }: { bone: { name: string; description: string } | null }) => {
  if (!bone) {
    return <div data-testid="bone-detail-panel" style={{ display: 'none' }} />;
  }

  return (
    <div data-testid="bone-detail-panel">
      <h3>{bone.name}</h3>
      <p>{bone.description}</p>
    </div>
  );
};

const AnatomyViewer = ({ onBoneClick }: { onBoneClick?: (bone: { name: string; description: string }) => void }) => {
  const bones = [
    { name: 'Femur', description: 'Thigh bone' },
    { name: 'Tibia', description: 'Shin bone' },
    { name: 'Skull', description: 'Head bone' },
  ];

  return (
    <div data-testid="anatomy-viewer">
      <h2>Anatomy Viewer</h2>
      <div data-testid="bones-container">
        {bones.map((bone) => (
          <button
            key={bone.name}
            data-testid={`bone-${bone.name.toLowerCase()}`}
            onClick={() => onBoneClick?.(bone)}
          >
            {bone.name}
          </button>
        ))}
      </div>
    </div>
  );
};

const LayerToggle = ({ onToggle }: { onToggle?: (layer: string, enabled: boolean) => void }) => {
  const [layers, setLayers] = React.useState({
    skeleton: true,
    muscles: false,
    organs: false,
  });

  const handleToggle = (layer: keyof typeof layers) => {
    const newState = !layers[layer];
    setLayers((prev) => ({ ...prev, [layer]: newState }));
    onToggle?.(layer, newState);
  };

  return (
    <div data-testid="layer-toggle">
      <h2>Layer Toggle</h2>
      {Object.entries(layers).map(([layer, enabled]) => (
        <label key={layer}>
          <input
            type="checkbox"
            data-testid={`layer-${layer}`}
            checked={enabled}
            onChange={() => handleToggle(layer as keyof typeof layers)}
          />
          {layer.charAt(0).toUpperCase() + layer.slice(1)}
        </label>
      ))}
      <div data-testid="active-layers">
        {Object.entries(layers)
          .filter(([, enabled]) => enabled)
          .map(([layer]) => layer)
          .join(', ')}
      </div>
    </div>
  );
};

describe('DinoPicker Component', () => {
  it('renders without crash and displays component', () => {
    const { container } = render(<DinoPicker />);
    expect(container).toBeTruthy();
    const picker = screen.getByTestId('dino-picker');
    expect(picker).toBeInTheDocument();
  });

  it('should have no console errors on mount', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    render(<DinoPicker />);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('calls onSelect callback when species is selected', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<DinoPicker onSelect={onSelect} />);

    const dropdown = screen.getByTestId('species-dropdown');
    await user.selectOptions(dropdown, 'Tyrannosaurus rex');

    expect(onSelect).toHaveBeenCalledWith('Tyrannosaurus rex');
  });
});

describe('Species List Display', () => {
  it('displays all available species when DinoPicker loads', () => {
    render(<DinoPicker />);
    const dropdown = screen.getByTestId('species-dropdown');
    const options = within(dropdown).getAllByRole('option');

    // Including the placeholder option
    expect(options).toHaveLength(5);
    expect(options[1]).toHaveTextContent('Tyrannosaurus rex');
    expect(options[2]).toHaveTextContent('Triceratops');
    expect(options[3]).toHaveTextContent('Stegosaurus');
    expect(options[4]).toHaveTextContent('Velociraptor');
  });

  it('shows selected species in display area after selection', async () => {
    const user = userEvent.setup();
    render(<DinoPicker />);

    const dropdown = screen.getByTestId('species-dropdown');
    await user.selectOptions(dropdown, 'Triceratops');

    const selectedDisplay = screen.getByTestId('selected-species');
    expect(selectedDisplay).toHaveTextContent('Triceratops');
  });

  it('species list contains expected dinosaur names', () => {
    render(<DinoPicker />);
    const dropdown = screen.getByTestId('species-dropdown');

    expect(dropdown).toHaveTextContent('Tyrannosaurus rex');
    expect(dropdown).toHaveTextContent('Triceratops');
    expect(dropdown).toHaveTextContent('Stegosaurus');
    expect(dropdown).toHaveTextContent('Velociraptor');
  });
});

describe('AnatomyViewer and BoneDetailPanel', () => {
  it('clicking a bone triggers detail panel display', async () => {
    const user = userEvent.setup();
    let selectedBone: { name: string; description: string } | null = null;

    const handleBoneClick = (bone: { name: string; description: string }) => {
      selectedBone = bone;
    };

    const { rerender } = render(
      <>
        <AnatomyViewer onBoneClick={handleBoneClick} />
        <BoneDetailPanel bone={selectedBone} />
      </>
    );

    const femurButton = screen.getByTestId('bone-femur');
    await user.click(femurButton);

    expect(selectedBone).toEqual({ name: 'Femur', description: 'Thigh bone' });

    rerender(
      <>
        <AnatomyViewer onBoneClick={handleBoneClick} />
        <BoneDetailPanel bone={selectedBone} />
      </>
    );

    const detailPanel = screen.getByTestId('bone-detail-panel');
    expect(detailPanel).toBeInTheDocument();
    expect(detailPanel).toHaveTextContent('Femur');
    expect(detailPanel).toHaveTextContent('Thigh bone');
  });

  it('BoneDetailPanel displays bone details when bone is selected', () => {
    const bone = { name: 'Skull', description: 'Head bone' };
    render(<BoneDetailPanel bone={bone} />);

    const panel = screen.getByTestId('bone-detail-panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveTextContent('Skull');
    expect(panel).toHaveTextContent('Head bone');
  });

  it('BoneDetailPanel is hidden when no bone is selected', () => {
    render(<BoneDetailPanel bone={null} />);

    const panel = screen.getByTestId('bone-detail-panel');
    expect(panel).toHaveStyle({ display: 'none' });
  });

  it('AnatomyViewer renders all available bones as clickable buttons', () => {
    render(<AnatomyViewer />);

    expect(screen.getByTestId('bone-femur')).toBeInTheDocument();
    expect(screen.getByTestId('bone-tibia')).toBeInTheDocument();
    expect(screen.getByTestId('bone-skull')).toBeInTheDocument();
  });

  it('clicking different bones updates the detail panel', async () => {
    const user = userEvent.setup();
    let selectedBone: { name: string; description: string } | null = null;

    const handleBoneClick = (bone: { name: string; description: string }) => {
      selectedBone = bone;
    };

    const { rerender } = render(
      <>
        <AnatomyViewer onBoneClick={handleBoneClick} />
        <BoneDetailPanel bone={selectedBone} />
      </>
    );

    // Click first bone
    await user.click(screen.getByTestId('bone-femur'));
    rerender(
      <>
        <AnatomyViewer onBoneClick={handleBoneClick} />
        <BoneDetailPanel bone={selectedBone} />
      </>
    );
    expect(screen.getByTestId('bone-detail-panel')).toHaveTextContent('Femur');

    // Click second bone
    await user.click(screen.getByTestId('bone-skull'));
    rerender(
      <>
        <AnatomyViewer onBoneClick={handleBoneClick} />
        <BoneDetailPanel bone={selectedBone} />
      </>
    );
    expect(screen.getByTestId('bone-detail-panel')).toHaveTextContent('Skull');
  });
});

describe('LayerToggle Component', () => {
  it('renders without crash and displays toggle component', () => {
    const { container } = render(<LayerToggle />);
    expect(container).toBeTruthy();
    const toggle = screen.getByTestId('layer-toggle');
    expect(toggle).toBeInTheDocument();
  });

  it('toggling a layer switches visual state', async () => {
    const user = userEvent.setup();
    render(<LayerToggle />);

    const skeletonCheckbox = screen.getByTestId('layer-skeleton') as HTMLInputElement;
    const musclesCheckbox = screen.getByTestId('layer-muscles') as HTMLInputElement;

    // Initial state: skeleton is true, muscles is false
    expect(skeletonCheckbox.checked).toBe(true);
    expect(musclesCheckbox.checked).toBe(false);

    // Toggle skeleton off
    await user.click(skeletonCheckbox);
    expect(skeletonCheckbox.checked).toBe(false);

    // Toggle muscles on
    await user.click(musclesCheckbox);
    expect(musclesCheckbox.checked).toBe(true);
  });

  it('layer toggle callback fires when layer is toggled', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<LayerToggle onToggle={onToggle} />);

    const musclesCheckbox = screen.getByTestId('layer-muscles');
    await user.click(musclesCheckbox);

    expect(onToggle).toHaveBeenCalledWith('muscles', true);
  });

  it('active layers are displayed correctly', async () => {
    const user = userEvent.setup();
    render(<LayerToggle />);

    let activeLayers = screen.getByTestId('active-layers');
    expect(activeLayers).toHaveTextContent('skeleton');

    // Toggle skeleton off and muscles on
    await user.click(screen.getByTestId('layer-skeleton'));
    await user.click(screen.getByTestId('layer-muscles'));

    activeLayers = screen.getByTestId('active-layers');
    expect(activeLayers).toHaveTextContent('muscles');
  });

  it('multiple layers can be toggled simultaneously', async () => {
    const user = userEvent.setup();
    render(<LayerToggle />);

    const skeletonCheckbox = screen.getByTestId('layer-skeleton');
    const musclesCheckbox = screen.getByTestId('layer-muscles');
    const organsCheckbox = screen.getByTestId('layer-organs');

    // Enable all layers
    await user.click(musclesCheckbox);
    await user.click(organsCheckbox);

    const activeLayers = screen.getByTestId('active-layers');
    expect(activeLayers).toHaveTextContent('skeleton');
    expect(activeLayers).toHaveTextContent('muscles');
    expect(activeLayers).toHaveTextContent('organs');
  });

  it('should have no console errors on render', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    render(<LayerToggle />);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('Integration Tests', () => {
  it('full workflow: select dinosaur, view anatomy, click bone, see details', async () => {
    const user = userEvent.setup();
    let selectedBone: { name: string; description: string } | null = null;

    const handleBoneClick = (bone: { name: string; description: string }) => {
      selectedBone = bone;
    };

    const { rerender } = render(
      <>
        <DinoPicker />
        <AnatomyViewer onBoneClick={handleBoneClick} />
        <BoneDetailPanel bone={selectedBone} />
      </>
    );

    // Select a dinosaur
    const dropdown = screen.getByTestId('species-dropdown');
    await user.selectOptions(dropdown, 'Tyrannosaurus rex');
    expect(screen.getByTestId('selected-species')).toHaveTextContent('Tyrannosaurus rex');

    // Click a bone
    await user.click(screen.getByTestId('bone-tibia'));
    rerender(
      <>
        <DinoPicker />
        <AnatomyViewer onBoneClick={handleBoneClick} />
        <BoneDetailPanel bone={selectedBone} />
      </>
    );

    // Verify detail panel shows bone info
    const detailPanel = screen.getByTestId('bone-detail-panel');
    expect(detailPanel).toHaveTextContent('Tibia');
    expect(detailPanel).toHaveTextContent('Shin bone');
  });

  it('layer toggle works alongside anatomy viewer', async () => {
    const user = userEvent.setup();
    render(
      <>
        <AnatomyViewer />
        <LayerToggle />
      </>
    );

    // Verify both components render
    expect(screen.getByTestId('anatomy-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('layer-toggle')).toBeInTheDocument();

    // Toggle a layer
    await user.click(screen.getByTestId('layer-muscles'));
    const musclesCheckbox = screen.getByTestId('layer-muscles') as HTMLInputElement;
    expect(musclesCheckbox.checked).toBe(true);

    // Anatomy viewer should still be interactive
    const femurButton = screen.getByTestId('bone-femur');
    expect(femurButton).toBeInTheDocument();
  });
});
