declare module 'frappe-gantt-css';

declare module 'frappe-gantt' {
    interface GanttTask {
        id: string;
        name: string;
        start: string;
        end: string;
        progress?: number;
        dependencies?: string;
        custom_class?: string;
    }

    interface GanttOptions {
        view_mode?: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month' | 'Year';
        date_format?: string;
        language?: string;
        readonly?: boolean;
        on_click?: (task: GanttTask) => void;
        on_date_change?: (task: GanttTask, start: Date, end: Date) => void;
    }

    class Gantt {
        constructor(wrapper: string | HTMLElement, tasks: GanttTask[], options?: GanttOptions);
        change_view_mode(mode: string): void;
        refresh(tasks: GanttTask[]): void;
    }

    export default Gantt;
}
