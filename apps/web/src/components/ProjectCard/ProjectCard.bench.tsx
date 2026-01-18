import { bench, describe } from 'vitest';
import { render } from '@testing-library/react';
import ProjectCard from './ProjectCard';
import { Project } from '@/data/projects';

const mockProject: Project = {
    id: 'bench-project',
    title: 'Benchmark Project',
    description: 'A project for benchmarking performance',
    tech: ['React', 'Vitest'],
    imageUrl: 'https://placehold.co/600x400',
    owner: 'anchildress1',
};

describe('ProjectCard Performance', () => {
    bench('render ProjectCard', () => {
        render(
            <ProjectCard
                project={mockProject}
                onSelect={() => { }}
            />
        );
    });
});
