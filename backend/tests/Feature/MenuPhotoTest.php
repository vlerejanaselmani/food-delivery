<?php

namespace Tests\Feature;

use App\Models\Food;
use App\Models\Restaurant;
use Database\Seeders\MenuSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class MenuPhotoTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_seeded_foods_have_individual_dish_photos(): void
    {
        $this->seed(MenuSeeder::class);
        $photos = Food::pluck('image_url');
        $this->assertCount(18, $photos->unique());
        $this->assertDatabaseHas('food', ['name' => 'Garden Burger', 'image_url' => '/images/garden-burger.jpg']);
        $this->assertDatabaseHas('food', ['name' => 'Baklava', 'image_url' => '/images/baklava.jpg']);
        $this->assertDatabaseHas('food', ['name' => 'Falafel Wrap', 'image_url' => '/images/falafel-wrap.jpg']);
    }

    public function test_photo_upgrade_preserves_custom_uploads_and_other_food_details(): void
    {
        $restaurant = Restaurant::factory()->create(['name' => 'Burger Theory']);
        $food = Food::factory()->create(['restaurant_id' => $restaurant->id, 'name' => 'Garden Burger', 'image_url' => '/images/salad.jpg', 'price_cents' => 999]);
        $custom = Food::factory()->create(['restaurant_id' => $restaurant->id, 'name' => 'Chocolate Brownie', 'image_url' => '/storage/food-images/custom.jpg']);
        $unrelated = Food::factory()->create(['name' => 'Garden Burger', 'image_url' => '/images/salad.jpg']);
        $migration = require database_path('migrations/2026_09_18_000210_correct_seeded_food_photos.php');
        $migration->up();
        $this->assertSame('/images/garden-burger.jpg', $food->fresh()->image_url);
        $this->assertSame(999, $food->fresh()->price_cents);
        $this->assertSame('/storage/food-images/custom.jpg', $custom->fresh()->image_url);
        $this->assertSame('/images/salad.jpg', $unrelated->fresh()->image_url);
        $migration->down();
        $this->assertSame('/images/salad.jpg', $food->fresh()->image_url);
        $this->assertSame('/storage/food-images/custom.jpg', $custom->fresh()->image_url);
    }
}
