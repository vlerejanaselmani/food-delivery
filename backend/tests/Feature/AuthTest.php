<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_registration_creates_customer_even_if_admin_role_is_sent(): void
    {
        $this->postJson('/api/v1/register', ['name' => 'Arta', 'email' => 'arta@example.com', 'password' => 'secret123', 'city' => 'Prishtinë', 'phone' => '044 123 456', 'role' => 'admin'])->assertCreated()->assertJsonPath('user.role', 'user')->assertJsonPath('user.phone', '+38344123456')->assertJsonMissingPath('user.password');
        $this->assertDatabaseHas('users', ['email' => 'arta@example.com', 'role' => 'user']);
        $this->getJson('/api/v1/user')->assertOk()->assertJsonPath('user.email', 'arta@example.com');
    }

    public function test_login_and_logout_use_session_authentication(): void
    {
        $user = User::factory()->create();
        $this->postJson('/api/v1/login', ['email' => $user->email, 'password' => 'password'])->assertOk()->assertJsonPath('user.id', $user->id);
        $this->postJson('/api/v1/logout')->assertOk();
        $this->assertGuest('web');
    }

    public function test_invalid_credentials_return_422(): void
    {
        $this->postJson('/api/v1/login', ['email' => 'missing@example.com', 'password' => 'wrong'])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_guest_cannot_read_profile(): void
    {
        $this->getJson('/api/v1/user')->assertUnauthorized();
    }

    public function test_registration_requires_contact_details_and_valid_city(): void
    {
        $this->postJson('/api/v1/register', ['city' => 'London'])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'password', 'city', 'phone']);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_city_dropdown_covers_all_municipalities(): void
    {
        $this->getJson('/api/v1/cities')->assertOk()->assertJsonCount(38, 'data');
    }
}
