<?php

declare(strict_types=1);

namespace App\Modules\Projects\Export;

use App\Modules\Work\Models\Task;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class TaskExporter
{
    private const HEADERS = ['Title', 'Status', 'Priority', 'Assignee', 'Reporter', 'Epic', 'Due Date', 'Created'];

    /**
     * @param  Collection<int, Task>  $tasks
     * @return list<list<string>>
     */
    private static function rows(Collection $tasks): array
    {
        return $tasks->map(fn (Task $task) => [
            $task->title,
            $task->workflowStatus?->name ?? '',
            is_object($task->priority) ? $task->priority->value : (string) $task->priority,
            $task->assignee->name ?? '',
            $task->reporter->name ?? '',
            $task->epic->title ?? '',
            $task->due_date instanceof \DateTimeInterface ? $task->due_date->format('Y-m-d') : '',
            $task->created_at->format('Y-m-d H:i'),
        ])->all();
    }

    /** @param  Collection<int, Task>  $tasks */
    public static function csv(Collection $tasks, string $filename): StreamedResponse
    {
        return response()->streamDownload(function () use ($tasks) {
            $out = fopen('php://output', 'w');
            assert($out !== false);
            fputcsv($out, self::HEADERS);
            foreach (self::rows($tasks) as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /** @param  Collection<int, Task>  $tasks */
    public static function excel(Collection $tasks, string $filename): StreamedResponse
    {
        return response()->streamDownload(function () use ($tasks) {
            $rows = self::rows($tasks);
            echo '<?xml version="1.0" encoding="UTF-8"?>'."\n";
            echo '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'."\n";
            echo '<Worksheet ss:Name="Tasks"><Table>'."\n";
            echo '<Row>';
            foreach (self::HEADERS as $h) {
                echo '<Cell><Data ss:Type="String">'.htmlspecialchars($h).'</Data></Cell>';
            }
            echo "</Row>\n";
            foreach ($rows as $row) {
                echo '<Row>';
                foreach ($row as $cell) {
                    echo '<Cell><Data ss:Type="String">'.htmlspecialchars($cell).'</Data></Cell>';
                }
                echo "</Row>\n";
            }
            echo "</Table></Worksheet></Workbook>\n";
        }, $filename, ['Content-Type' => 'application/vnd.ms-excel']);
    }

    /** @param  Collection<int, Task>  $tasks */
    public static function html(Collection $tasks, string $projectName, string $filename): StreamedResponse
    {
        return response()->streamDownload(function () use ($tasks, $projectName) {
            $rows = self::rows($tasks);
            echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'.htmlspecialchars($projectName).' — Tasks</title>';
            echo '<style>body{font-family:system-ui,sans-serif;margin:2rem}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5;font-weight:600}tr:hover{background:#fafafa}h1{margin-bottom:1rem}</style>';
            echo "</head><body>\n";
            echo '<h1>'.htmlspecialchars($projectName)." — Tasks</h1>\n<table>\n<thead><tr>";
            foreach (self::HEADERS as $h) {
                echo '<th>'.htmlspecialchars($h).'</th>';
            }
            echo "</tr></thead>\n<tbody>\n";
            foreach ($rows as $row) {
                echo '<tr>';
                foreach ($row as $cell) {
                    echo '<td>'.htmlspecialchars($cell).'</td>';
                }
                echo "</tr>\n";
            }
            echo "</tbody></table></body></html>\n";
        }, $filename, ['Content-Type' => 'text/html']);
    }

    /** @param  Collection<int, Task>  $tasks */
    public static function markdown(Collection $tasks, string $projectName, string $filename): StreamedResponse
    {
        return response()->streamDownload(function () use ($tasks, $projectName) {
            $rows = self::rows($tasks);
            echo "# {$projectName} — Tasks\n\n";
            echo '| '.implode(' | ', self::HEADERS)." |\n";
            echo '| '.implode(' | ', array_fill(0, count(self::HEADERS), '---'))." |\n";
            foreach ($rows as $row) {
                echo '| '.implode(' | ', $row)." |\n";
            }
        }, $filename, ['Content-Type' => 'text/markdown']);
    }
}
