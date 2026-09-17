<?php

namespace Database\Factories;

use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;

class FoodFactory extends Factory
{
    public function definition(): array
    {
        return ['restaurant_id' => Restaurant::factory(), 'name' => fake()->words(2, true), 'description' => 'Freshly prepared.', 'category' => 'Mains', 'price_cents' => 650, 'image_url' => '/images/pizza.jpg', 'is_available' => true];
    }
}
