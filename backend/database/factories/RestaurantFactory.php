<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class RestaurantFactory extends Factory
{
    public function definition(): array
    {
        return ['name' => fake()->company(), 'cuisine' => 'Italian', 'description' => 'Fresh food made with care.', 'image_url' => '/images/pizza.jpg', 'delivery_fee_cents' => 150, 'delivery_minutes' => 30, 'is_active' => true];
    }
}
