import { bench, describe } from 'vitest';
import { render } from '@testing-library/react';
import ProjectCard from './ProjectCard';
import { Project } from '@/lib/api';

const mockProject: Project = {
  id: 'bench-project',
  title: 'Benchmark Project',
  status: 'Active',
  description: 'A project for benchmarking performance',
  purpose: 'Performance testing and benchmarking',
  long_description:
    'A longer description for the benchmark project to test text rendering performance.',
  outcome: 'Valid benchmarks',
  repo_url: 'https://github.com/anchildress1/system-notes',
  tech: [
    { name: 'React', role: 'UI' },
    { name: 'Vitest', role: 'Testing' },
  ],
  image_url: 'https://placehold.co/600x400',
  owner: 'anchildress1',
};

describe('ProjectCard Performance', () => {
  bench('render ProjectCard', () => {
    render(<ProjectCard project={mockProject} onSelect={() => {}} />);
  });
});
