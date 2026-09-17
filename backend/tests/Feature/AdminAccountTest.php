<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminAccountTest extends TestCase
{
    use LazilyRefreshDatabase;

    private function account(): array
    {
        return ['name' => 'Kitchen Admin', 'email' => 'TEAM@example.com', 'password' => 'team-secret'];
    }

    public function test_admin_can_create_an_admin_without_switching_sessions(): void
    {
        $creator = User::factory()->create(['role' => 'admin']);
        $response = $this->actingAs($creator)->postJson('/api/v1/admin/admins', $this->account() + ['role' => 'user', 'email_verified_at' => now()]);
        $response->assertCreated()->assertJsonPath('user.role', 'admin')->assertJsonPath('user.email', 'team@example.com')->assertJsonMissingPath('user.password');
        $admin = User::findOrFail($response->json('user.id'));
        $this->assertTrue(Hash::check('team-secret', $admin->password));
        $this->assertNull($admin->email_verified_at);
        $this->assertAuthenticatedAs($creator);
        $this->postJson('/api/v1/logout')->assertOk();
        $this->postJson('/api/v1/login', ['email' => 'team@example.com', 'password' => 'team-secret'])->assertOk()->assertJsonPath('user.role', 'admin');
        $this->getJson('/api/v1/admin/restaurants')->assertOk();
    }

    public function test_guest_cannot_create_admins(): void
    {
        $this->postJson('/api/v1/admin/admins', $this->account())->assertUnauthorized();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_customer_cannot_create_admins(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/api/v1/admin/admins', $this->account())->assertForbidden();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_admin_creation_requires_valid_account_details(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $this->postJson('/api/v1/admin/admins', [])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'password']);
        $this->postJson('/api/v1/admin/admins', ['name' => str_repeat('a', 101), 'email' => 'invalid', 'password' => 'short'])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'password']);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_existing_email_is_rejected_without_changing_the_account(): void
    {
        $existing = User::factory()->create(['email' => 'team@example.com']);
        $this->actingAs(User::factory()->create(['role' => 'admin']))->postJson('/api/v1/admin/admins', $this->account())->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertSame('user', $existing->fresh()->role);
        $this->assertDatabaseCount('users', 2);
    }
}
