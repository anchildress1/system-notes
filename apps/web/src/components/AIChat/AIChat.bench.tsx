import { bench, describe } from 'vitest';
import { render } from '@testing-library/react';
import AIChat from './AIChat';

describe('AIChat Performance', () => {
    bench('render AIChat', () => {
        render(<AIChat />);
    });
});
