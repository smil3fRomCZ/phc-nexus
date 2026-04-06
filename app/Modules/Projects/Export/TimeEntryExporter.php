<?php

declare(strict_types=1);

namespace App\Modules\Projects\Export;

use App\Modules\Work\Models\TimeEntry;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class TimeEntryExporter
{
    private const HEADERS = ['Datum', 'Hodiny', 'Uživatel', 'Úkol', 'Epic', 'Poznámka'];

    private const TAG_MAP = [
        'Datum' => 'Date',
        'Hodiny' => 'Hours',
        'Uživatel' => 'User',
        'Úkol' => 'Task',
        'Epic' => 'Epic',
        'Poznámka' => 'Note',
    ];

    /**
     * @param  Collection<int, TimeEntry>  $entries
     * @return list<list<string>>
     */
    private static function rows(Collection $entries): array
    {
        return $entries->map(fn (TimeEntry $entry): array => [
            $entry->date instanceof \DateTimeInterface ? $entry->date->format('Y-m-d') : (string) $entry->date,
            number_format((float) $entry->hours, 2),
            $entry->user->name ?? '',
            $entry->task->title ?? '',
            $entry->epic->title ?? '',
            $entry->note ?? '',
        ])->all();
    }

    /** @param  Collection<int, TimeEntry>  $entries */
    public static function csv(Collection $entries, string $filename): StreamedResponse
    {
        return response()->streamDownload(function () use ($entries) {
            $out = fopen('php://output', 'w');
            assert($out !== false);
            fputcsv($out, self::HEADERS);
            foreach (self::rows($entries) as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /** @param  Collection<int, TimeEntry>  $entries */
    public static function xml(Collection $entries, string $filename): StreamedResponse
    {
        return response()->streamDownload(function () use ($entries) {
            $rows = self::rows($entries);
            echo '<?xml version="1.0" encoding="UTF-8"?>'."\n";
            echo "<TimeEntries>\n";
            foreach ($rows as $row) {
                echo "  <Entry>\n";
                foreach (self::HEADERS as $i => $header) {
                    $tag = self::TAG_MAP[$header] ?? $header;
                    echo '    <'.$tag.'>'.htmlspecialchars($row[$i]).'</'.$tag.">\n";
                }
                echo "  </Entry>\n";
            }
            echo "</TimeEntries>\n";
        }, $filename, ['Content-Type' => 'application/xml']);
    }

    /** @param  Collection<int, TimeEntry>  $entries */
    public static function markdown(Collection $entries, string $contextName, string $filename): StreamedResponse
    {
        return response()->streamDownload(function () use ($entries, $contextName) {
            $rows = self::rows($entries);
            $totalHours = $entries->sum('hours');
            echo "# {$contextName} — Časový výkaz\n\n";
            echo "**Celkem:** {$totalHours} h | **Záznamů:** ".count($rows)."\n\n";
            echo '| '.implode(' | ', self::HEADERS)." |\n";
            echo '| '.implode(' | ', array_fill(0, count(self::HEADERS), '---'))." |\n";
            foreach ($rows as $row) {
                echo '| '.implode(' | ', $row)." |\n";
            }
        }, $filename, ['Content-Type' => 'text/markdown']);
    }
}
