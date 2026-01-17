import { render, screen } from '@testing-library/react';
import SocialBanner from './SocialBanner';
import { describe, it, expect } from 'vitest';

describe('SocialBanner', () => {
    it('renders the RAI-Lint title', () => {
        render(<SocialBanner />);
        expect(screen.getByText('RAI-Lint')).toBeDefined();
    });

    it('renders the witty subtitle', () => {
        render(<SocialBanner />);
        expect(screen.getByText(/Because your AI needs a babysitter/i)).toBeDefined();
    });

    it('contains a link to the GitHub repo', () => {
        render(<SocialBanner />);
        const link = screen.getByRole('link', { name: /View on GitHub/i });
        expect(link).toBeDefined();
        expect(link.getAttribute('href')).toBe('https://github.com/CheckMarKDevTools/rai-lint');
    });
});
