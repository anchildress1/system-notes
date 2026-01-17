import { render, screen } from '@testing-library/react';
import ProjectGrid from './ProjectGrid';
import { describe, it, expect, beforeAll } from 'vitest';

// Mock IntersectionObserver for Framer Motion inside tests
beforeAll(() => {
    const IntersectionObserverMock = class {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
    global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
});

describe('ProjectGrid', () => {
    it('renders the mocked projects', () => {
        render(<ProjectGrid />);
        expect(screen.getByText('System Notes')).toBeDefined();
        expect(screen.getByText('Commitlint Config')).toBeDefined();
    });

    it('renders the correct tech stack tags', () => {
        render(<ProjectGrid />);
        expect(screen.getByText('Self-Deprecation')).toBeDefined();
        expect(screen.getByText('Discipline')).toBeDefined();
    });
});
