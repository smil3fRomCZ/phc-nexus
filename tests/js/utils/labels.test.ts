import { describe, it, expect } from 'vitest';
import {
    taskStatusLabels,
    taskPriorityLabels,
    epicStatusLabels,
    projectStatusLabels,
    approvalStatusLabels,
} from '@/utils/labels';

describe('taskStatusLabels', () => {
    it('obsahuje všech 6 stavů', () => {
        expect(Object.keys(taskStatusLabels)).toHaveLength(6);
    });

    it('mapuje backlog na Backlog', () => {
        expect(taskStatusLabels.backlog).toBe('Backlog');
    });

    it('mapuje in_progress na V průběhu', () => {
        expect(taskStatusLabels.in_progress).toBe('V průběhu');
    });

    it('mapuje done na Hotovo', () => {
        expect(taskStatusLabels.done).toBe('Hotovo');
    });
});

describe('taskPriorityLabels', () => {
    it('obsahuje 4 priority', () => {
        expect(Object.keys(taskPriorityLabels)).toHaveLength(4);
    });

    it('mapuje urgent na Urgentní', () => {
        expect(taskPriorityLabels.urgent).toBe('Urgentní');
    });
});

describe('epicStatusLabels', () => {
    it('obsahuje 4 stavy', () => {
        expect(Object.keys(epicStatusLabels)).toHaveLength(4);
    });
});

describe('projectStatusLabels', () => {
    it('obsahuje 5 stavů', () => {
        expect(Object.keys(projectStatusLabels)).toHaveLength(5);
    });

    it('mapuje draft na Návrh', () => {
        expect(projectStatusLabels.draft).toBe('Návrh');
    });
});

describe('approvalStatusLabels', () => {
    it('obsahuje 4 stavy', () => {
        expect(Object.keys(approvalStatusLabels)).toHaveLength(4);
    });

    it('mapuje pending na Čeká na schválení', () => {
        expect(approvalStatusLabels.pending).toBe('Čeká na schválení');
    });
});
