<?php

namespace Tests\Feature;

use App\Models\Food;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use LazilyRefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_admin_can_create_edit_and_delete_a_restaurant(): void
    {
        $this->actingAs($this->admin());
        $data = Restaurant::factory()->make()->toArray();
        $id = $this->postJson('/api/v1/admin/restaurants', $data)->assertCreated()->json('data.id');
        $this->patchJson('/api/v1/admin/restaurants/'.$id, [...$data, 'name' => 'New kitchen', 'is_active' => false])->assertOk()->assertJsonPath('data.name', 'New kitchen');
        $this->assertDatabaseHas('restaurants', ['id' => $id, 'is_active' => false]);
        $this->deleteJson('/api/v1/admin/restaurants/'.$id)->assertNoContent();
        $this->assertDatabaseMissing('restaurants', ['id' => $id]);
    }

    public function test_admin_can_manage_food_and_public_availability(): void
    {
        $this->actingAs($this->admin());
        $restaurant = Restaurant::factory()->create();
        $data = Food::factory()->make(['restaurant_id' => $restaurant->id])->toArray();
        $id = $this->postJson('/api/v1/admin/foods', $data)->assertCreated()->json('data.id');
        $this->patchJson('/api/v1/admin/foods/'.$id, [...$data, 'price_cents' => 925, 'is_available' => false])->assertOk()->assertJsonPath('data.price_cents', 925);
        $this->getJson('/api/v1/restaurants/'.$restaurant->id)->assertJsonCount(0, 'data.foods');
        $this->getJson('/api/v1/admin/restaurants')->assertJsonCount(1, 'data.0.foods');
        $this->deleteJson('/api/v1/admin/foods/'.$id)->assertNoContent();
        $this->assertDatabaseMissing('food', ['id' => $id]);
    }

    public function test_admin_can_move_orders_through_all_statuses_and_filter(): void
    {
        $order = Order::factory()->create();
        $this->actingAs($this->admin());
        foreach (['processing', 'on the way', 'done'] as $status) {
            $this->patchJson('/api/v1/admin/orders/'.$order->id, ['status' => $status])->assertOk()->assertJsonPath('data.status', $status);
            $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => $status]);
        }
        $this->getJson('/api/v1/admin/orders?status=done')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/admin/orders?status=new')->assertJsonCount(0, 'data');
        $this->patchJson('/api/v1/admin/orders/'.$order->id, ['status' => 'refunded'])->assertUnprocessable();
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'done']);
    }

    public function test_guests_and_customers_cannot_access_admin_actions(): void
    {
        $food = Food::factory()->create();
        $order = Order::factory()->create();
        $this->getJson('/api/v1/admin/restaurants')->assertUnauthorized();
        $this->actingAs(User::factory()->create());
        $this->getJson('/api/v1/admin/orders')->assertForbidden();
        $this->postJson('/api/v1/admin/restaurants', [])->assertForbidden();
        $this->patchJson('/api/v1/admin/restaurants/'.$food->restaurant_id, [])->assertForbidden();
        $this->deleteJson('/api/v1/admin/restaurants/'.$food->restaurant_id)->assertForbidden();
        $this->postJson('/api/v1/admin/foods', [])->assertForbidden();
        $this->patchJson('/api/v1/admin/foods/'.$food->id, [])->assertForbidden();
        $this->deleteJson('/api/v1/admin/foods/'.$food->id)->assertForbidden();
        $this->patchJson('/api/v1/admin/orders/'.$order->id, ['status' => 'done'])->assertForbidden();
        $this->assertModelExists($food);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'new']);
    }

    public function test_invalid_menu_payload_is_rejected_without_writing(): void
    {
        $this->actingAs($this->admin())->postJson('/api/v1/admin/foods', ['price_cents' => -5])->assertUnprocessable()->assertJsonValidationErrors(['restaurant_id', 'name', 'description', 'category', 'price_cents', 'image_url', 'is_available']);
        $this->assertDatabaseCount('food',0);
    }
}
