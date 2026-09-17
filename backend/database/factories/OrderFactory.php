<?php

namespace Database\Factories;

use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderFactory extends Factory
{
    public function definition(): array
    {
        return ['reference' => (string) Str::uuid(), 'checkout_key' => (string) Str::uuid(), 'restaurant_id' => Restaurant::factory(), 'restaurant_name' => 'Test kitchen', 'customer_name' => 'Arta', 'city' => 'Prishtinë', 'phone' => '+38344123456', 'status' => 'new', 'subtotal_cents' => 650, 'delivery_fee_cents' => 150, 'total_cents' => 800];
    }
}
