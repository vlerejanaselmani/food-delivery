<?php

namespace Tests\Feature;

use Tests\TestCase;

class SpaRoutingTest extends TestCase
{
    public function test_frontend_deep_links_receive_the_built_app(): void
    {
        $index = public_path('index.html');
        $created = ! is_file($index);
        if ($created) {
            file_put_contents($index, '<html><div id="root"></div></html>');
        }
        try {
            foreach (['/restaurants/1', '/orders', '/favorites', '/admin/menus', '/admin/orders', '/login', '/register', '/cart', '/missing-page'] as $path) {
                $response = $this->get($path)->assertOk();
                $this->assertSame($index, $response->baseResponse->getFile()->getPathname());
            }
        } finally {
            if ($created) {
                unlink($index);
            }
        }
    }

    public function test_unknown_api_and_asset_routes_do_not_receive_the_frontend(): void
    {
        $this->getJson('/api/v1/missing')->assertNotFound()->assertHeader('Content-Type', 'application/json');
        $this->get('/storage/missing.jpg')->assertForbidden();
        foreach (['/api', '/sanctum/missing', '/assets/missing.js', '/images/missing.jpg'] as $path) {
            $this->get($path)->assertNotFound();
        }
    }
}
