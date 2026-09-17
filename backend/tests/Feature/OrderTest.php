<?php

namespace Tests\Feature;

use App\Models\Food;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use LazilyRefreshDatabase;

    private function checkoutData(string $key): array
    {
        return ['customer_name' => 'Arta', 'city' => 'Prishtinë', 'phone' => '044123456', 'checkout_key' => $key];
    }

    public function test_guest_checkout_uses_server_prices_and_is_retry_safe(): void
    {
        $food = Food::factory()->create(['price_cents' => 650]);
        $key = $this->postJson('/api/v1/cart/items', ['food_id' => $food->id, 'quantity' => 2])->json('data.checkout_key');
        $payload = [...$this->checkoutData($key), 'total_cents' => 1, 'status' => 'done', 'user_id' => 999];
        $this->postJson('/api/v1/orders', $payload)->assertCreated()->assertJsonPath('data.total_cents', 1450)->assertJsonPath('data.status', 'new');
        $this->postJson('/api/v1/orders', $payload)->assertOk()->assertJsonPath('data.total_cents', 1450);
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseHas('orders', ['user_id' => null, 'total_cents' => 1450]);
        $this->assertDatabaseHas('order_items', ['food_id' => $food->id, 'quantity' => 2, 'price_cents' => 650]);
        $this->getJson('/api/v1/cart')->assertJsonCount(0, 'data.items');
    }

    public function test_customer_history_is_private_and_snapshots_survive_menu_deletion(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $foreign = Order::factory()->create(['user_id' => $other->id]);
        $food = Food::factory()->create(['name' => 'Original dish']);
        $this->actingAs($user);
        $key = $this->postJson('/api/v1/cart/items', ['food_id' => $food->id, 'quantity' => 1])->json('data.checkout_key');
        $order = $this->postJson('/api/v1/orders', $this->checkoutData($key))->assertCreated()->json('data');
        $food->delete();
        $this->getJson('/api/v1/orders')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.items.0.name', 'Original dish');
        $this->getJson('/api/v1/orders/'.$order['id'])->assertOk();
        $this->getJson('/api/v1/orders/'.$foreign->id)->assertNotFound();
    }

    public function test_empty_cart_or_unavailable_food_cannot_create_order(): void
    {
        $key = $this->getJson('/api/v1/cart')->json('data.checkout_key');
        $this->postJson('/api/v1/orders', $this->checkoutData($key))->assertUnprocessable();
        $food = Food::factory()->create();
        $key = $this->postJson('/api/v1/cart/items', ['food_id' => $food->id, 'quantity' => 1])->json('data.checkout_key');
        $food->update(['is_available' => false]);
        $this->postJson('/api/v1/orders', $this->checkoutData($key))->assertUnprocessable();
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
    }

    public function test_checkout_requires_delivery_details(): void
    {
        $this->postJson('/api/v1/orders', [])->assertUnprocessable()->assertJsonValidationErrors(['customer_name', 'city', 'phone', 'checkout_key']);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_guest_cannot_read_purchase_history(): void
    {
        $this->getJson('/api/v1/orders')->assertUnauthorized();
    }

    public function test_menu_move_between_restaurants_invalidates_mixed_cart(): void
    {
        $first = Food::factory()->create();
        $second = Food::factory()->create(['restaurant_id' => $first->restaurant_id]);
        $this->postJson('/api/v1/cart/items', ['food_id' => $first->id, 'quantity' => 1])->assertOk();
        $key = $this->postJson('/api/v1/cart/items', ['food_id' => $second->id, 'quantity' => 1])->json('data.checkout_key');
        $second->update(['restaurant_id' => Restaurant::factory()->create()->id]);
        $this->postJson('/api/v1/orders', $this->checkoutData($key))->assertUnprocessable();
        $this->assertDatabaseCount('orders', 0);
    }
}
