<?php

namespace Tests\Feature;

use App\Models\Food;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class FavoriteTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_customer_can_save_food_and_restaurant_once_then_remove_them(): void
    {
        $user = User::factory()->create();
        $food = Food::factory()->create();
        $this->actingAs($user);
        $this->putJson('/api/v1/favorites/foods/'.$food->id)->assertOk();
        $this->putJson('/api/v1/favorites/foods/'.$food->id)->assertOk();
        $this->putJson('/api/v1/favorites/restaurants/'.$food->restaurant_id)->assertOk();
        $this->getJson('/api/v1/favorites')->assertOk()->assertJsonCount(1, 'foods')->assertJsonCount(1, 'restaurants');
        $this->assertDatabaseCount('food_user', 1);
        $this->deleteJson('/api/v1/favorites/foods/'.$food->id)->assertOk();
        $this->deleteJson('/api/v1/favorites/restaurants/'.$food->restaurant_id)->assertOk();
        $this->assertDatabaseCount('food_user', 0);
        $this->assertDatabaseCount('restaurant_user', 0);
    }

    public function test_favorites_are_private_and_require_login(): void
    {
        $food = Food::factory()->create();
        $user = User::factory()->create();
        $user->favoriteFoods()->attach($food);
        $this->getJson('/api/v1/favorites')->assertUnauthorized();
        $this->putJson('/api/v1/favorites/foods/'.$food->id)->assertUnauthorized();
        $this->actingAs(User::factory()->create())->getJson('/api/v1/favorites')->assertJsonCount(0, 'foods');
    }
}
