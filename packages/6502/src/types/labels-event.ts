import type { Labels } from '../labels.js';

export interface LabelsEvent {
    labels: Labels;
    message?: string;
}