<?php

namespace Tests\Feature;

use App\Models\Food;
use App\Models\Restaurant;
use Database\Seeders\MenuSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class RestaurantTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_guests_can_browse_three_seeded_menus_with_six_items_each(): void
    {
        $this->seed(MenuSeeder::class);
        $this->seed(MenuSeeder::class);
        $this->getJson('/api/v1/restaurants')->assertOk()->assertJsonCount(3, 'data')->assertJsonCount(6, 'data.0.foods')->assertJsonPath('data.0.foods.0.price_cents', 650);
        $this->assertDatabaseCount('food', 18);
    }

    public function test_inactive_restaurants_and_unavailable_food_are_hidden(): void
    {
        $hidden = Restaurant::factory()->create(['is_active' => false]);
        $restaurant = Restaurant::factory()->create();
        Food::factory()->for($restaurant)->create(['is_available' => false]);
        $this->getJson('/api/v1/restaurants')->assertJsonCount(1, 'data')->assertJsonCount(0, 'data.0.foods');
        $this->getJson('/api/v1/restaurants/'.$hidden->id)->assertNotFound();
        $this->getJson('/api/v1/restaurants/'.$restaurant->id)->assertOk()->assertJsonPath('data.id', $restaurant->id);
    }
}
