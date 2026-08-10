import { render } from '@testing-library/react';
import { SeferSection } from '../../../src/components/shared/SeferSection.js';

function getSection(container: HTMLElement) {
  return container.querySelector('.sefer-section') as HTMLElement;
}

function getColNums(container: HTMLElement) {
  return Array.from(container.querySelectorAll('.aliyah-col-num')) as HTMLElement[];
}

// ── structure ─────────────────────────────────────────────────────────────────

describe('SeferSection — structure', () => {
  it('renders a .sefer-section root containing children', () => {
    const { container } = render(
      <SeferSection title="T" badge="B" columnKeys={[]}>
        <div className="child">hello</div>
      </SeferSection>
    );
    const section = getSection(container);
    expect(section).toBeInTheDocument();
    expect(section.querySelector('.child')).toBeInTheDocument();
  });

  it('defaults opacity to 1', () => {
    const { container } = render(
      <SeferSection title="T" badge="B" columnKeys={[]}>x</SeferSection>
    );
    expect(getSection(container).style.opacity).toBe('1');
  });

  it('applies a custom opacity to the .sefer-section element', () => {
    const { container } = render(
      <SeferSection title="T" badge="B" columnKeys={[]} opacity={0.3}>x</SeferSection>
    );
    expect(getSection(container).style.opacity).toBe('0.3');
  });
});

// ── header ────────────────────────────────────────────────────────────────────

describe('SeferSection — header', () => {
  it('renders the title node inside .sefer-hdr', () => {
    const { container } = render(
      <SeferSection
        title={<><span className="heb">בְּרֵאשִׁית</span><span className="eng">Bereshit</span></>}
        badge="B"
        columnKeys={[]}
      >x</SeferSection>
    );
    const hdr = container.querySelector('.sefer-hdr')!;
    expect(hdr.querySelector('.heb')?.textContent).toBe('בְּרֵאשִׁית');
    expect(hdr.querySelector('.eng')?.textContent).toBe('Bereshit');
  });

  it('renders badge text inside .sefer-hdr .badge', () => {
    const { container } = render(
      <SeferSection title="T" badge={<>5/7 Aliyot &bull; 71%</>} columnKeys={[]}>x</SeferSection>
    );
    const badge = container.querySelector('.sefer-hdr .badge') as HTMLElement;
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('5/7 Aliyot');
    expect(badge.textContent).toContain('71%');
  });

  it('applies var(--text) color to the badge', () => {
    const { container } = render(
      <SeferSection title="T" badge="B" columnKeys={[]}>x</SeferSection>
    );
    const badge = container.querySelector('.sefer-hdr .badge') as HTMLElement;
    expect(badge.style.color).toBe('var(--text)');
  });
});

// ── column header ─────────────────────────────────────────────────────────────

describe('SeferSection — column header', () => {
  it('renders one .aliyah-col-num per columnKey', () => {
    const { container } = render(
      <SeferSection title="T" badge="B" columnKeys={[1, 2, 3]}>x</SeferSection>
    );
    expect(getColNums(container)).toHaveLength(3);
  });

  it('defaults to String(key) as the column label', () => {
    const { container } = render(
      <SeferSection title="T" badge="B" columnKeys={[1, 2, 3]}>x</SeferSection>
    );
    const nums = getColNums(container);
    expect(nums[0]?.textContent).toBe('1');
    expect(nums[1]?.textContent).toBe('2');
    expect(nums[2]?.textContent).toBe('3');
  });

  it('uses renderColumnLabel when provided', () => {
    const { container } = render(
      <SeferSection
        title="T" badge="B"
        columnKeys={[1, 2, 8]}
        renderColumnLabel={k => k === 8 ? 'M' : String(k)}
      >x</SeferSection>
    );
    const nums = getColNums(container);
    expect(nums[0]?.textContent).toBe('1');
    expect(nums[2]?.textContent).toBe('M');
  });

  it('renders no column headers when columnKeys is empty', () => {
    const { container } = render(
      <SeferSection title="T" badge="B" columnKeys={[]}>x</SeferSection>
    );
    expect(getColNums(container)).toHaveLength(0);
    expect(container.querySelector('.aliyah-col-header')).toBeInTheDocument();
  });
});
