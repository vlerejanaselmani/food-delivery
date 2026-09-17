<?php

namespace Tests\Feature;

use App\Models\Food;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_guest_can_add_edit_and_remove_items(): void
    {
        $food = Food::factory()->create(['price_cents' => 650]);
        $this->postJson('/api/v1/cart/items', ['food_id' => $food->id, 'quantity' => 2])->assertOk()->assertJsonPath('data.total_cents', 1450);
        $this->patchJson('/api/v1/cart/items/'.$food->id, ['quantity' => 3])->assertOk()->assertJsonPath('data.subtotal_cents', 1950);
        $this->deleteJson('/api/v1/cart/items/'.$food->id)->assertOk()->assertJsonCount(0, 'data.items')->assertJsonPath('data.total_cents', 0);
    }

    public function test_mixed_restaurant_cart_is_rejected_with_409_without_replacing_items(): void
    {
        $first = Food::factory()->create();
        $second = Food::factory()->create();
        $this->postJson('/api/v1/cart/items', ['food_id' => $first->id, 'quantity' => 1])->assertOk();
        $this->postJson('/api/v1/cart/items', ['food_id' => $second->id, 'quantity' => 1])->assertConflict();
        $this->getJson('/api/v1/cart')->assertJsonCount(1, 'data.items')->assertJsonPath('data.items.0.food_id', $first->id);
        $this->deleteJson('/api/v1/cart')->assertOk();
        $this->postJson('/api/v1/cart/items', ['food_id' => $second->id, 'quantity' => 1])->assertOk()->assertJsonPath('data.items.0.food_id', $second->id);
    }

    public function test_unavailable_food_and_invalid_quantities_return_422(): void
    {
        $food = Food::factory()->create(['is_available' => false]);
        $this->postJson('/api/v1/cart/items', ['food_id' => $food->id, 'quantity' => 1])->assertUnprocessable()->assertJsonValidationErrors('food_id');
        $this->postJson('/api/v1/cart/items', ['food_id' => $food->id, 'quantity' => -1])->assertUnprocessable()->assertJsonValidationErrors('quantity');
        $this->getJson('/api/v1/cart')->assertJsonCount(0, 'data.items');
    }

    public function test_cart_cannot_exceed_twenty_of_one_food(): void
    {
        $food = Food::factory()->create();
        $this->postJson('/api/v1/cart/items', ['food_id' => $food->id, 'quantity' => 20])->assertOk();
        $this->postJson('/api/v1/cart/items', ['food_id' => $food->id, 'quantity' => 1])->assertUnprocessable();
        $this->patchJson('/api/v1/cart/items/'.$food->id, ['quantity' => 0])->assertUnprocessable();
        $this->getJson('/api/v1/cart')->assertJsonPath('data.items.0.quantity',20);
    }
}
