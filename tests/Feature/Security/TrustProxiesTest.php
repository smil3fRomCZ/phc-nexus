<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

final class TrustProxiesTest extends TestCase
{
    public function test_request_ip_resolves_to_forwarded_client_ip(): void
    {
        Route::get('/_test/forwarded-ip', fn () => response()->json([
            'ip' => request()->ip(),
        ]));

        $response = $this
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->get('/_test/forwarded-ip', ['X-Forwarded-For' => '203.0.113.42']);

        $response->assertOk()->assertJson(['ip' => '203.0.113.42']);
    }

    public function test_request_scheme_resolves_to_forwarded_proto(): void
    {
        Route::get('/_test/forwarded-scheme', fn () => response()->json([
            'secure' => request()->isSecure(),
            'scheme' => request()->getScheme(),
        ]));

        $response = $this
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->get('/_test/forwarded-scheme', ['X-Forwarded-Proto' => 'https']);

        $response->assertOk()->assertJson([
            'secure' => true,
            'scheme' => 'https',
        ]);
    }

    public function test_request_host_resolves_to_forwarded_host(): void
    {
        Route::get('/_test/forwarded-host', fn () => response()->json([
            'host' => request()->getHost(),
        ]));

        $response = $this
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->get('/_test/forwarded-host', ['X-Forwarded-Host' => 'phc-nexus.eu']);

        $response->assertOk()->assertJson(['host' => 'phc-nexus.eu']);
    }
}
