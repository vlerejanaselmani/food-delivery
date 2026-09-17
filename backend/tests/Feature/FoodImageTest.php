<?php

namespace Tests\Feature;

use App\Models\Food;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FoodImageTest extends TestCase
{
    use LazilyRefreshDatabase;

    private function photo(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('meal.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII='));
    }

    public function test_admin_can_upload_and_assign_a_photo_to_food(): void
    {
        Storage::fake('public');
        $food = Food::factory()->create();
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $url = $this->postJson('/api/v1/admin/food-images', ['image' => $this->photo()])
            ->assertCreated()->json('image_url');
        Storage::disk('public')->assertExists(substr($url, strlen('/storage/')));
        $this->patchJson('/api/v1/admin/foods/'.$food->id, [...$food->toArray(), 'image_url' => $url])
            ->assertOk()->assertJsonPath('data.image_url', $url);
        $this->assertDatabaseHas('food', ['id' => $food->id, 'image_url' => $url]);
        $this->getJson('/api/v1/restaurants/'.$food->restaurant_id)->assertJsonPath('data.foods.0.image_url', $url);
    }

    public function test_upload_requires_an_admin(): void
    {
        Storage::fake('public');
        $this->postJson('/api/v1/admin/food-images', ['image' => $this->photo()])->assertUnauthorized();
        $this->actingAs(User::factory()->create())->postJson('/api/v1/admin/food-images', ['image' => $this->photo()])->assertForbidden();
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_invalid_and_oversized_uploads_return_422(): void
    {
        Storage::fake('public');
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $this->postJson('/api/v1/admin/food-images', [])->assertUnprocessable()->assertJsonValidationErrors('image');
        $this->postJson('/api/v1/admin/food-images', ['image' => UploadedFile::fake()->createWithContent('fake.jpg', '<script>bad</script>')])->assertUnprocessable()->assertJsonValidationErrors('image');
        $this->postJson('/api/v1/admin/food-images', ['image' => $this->photo()->size(5121)])->assertUnprocessable()->assertJsonValidationErrors('image');
        $this->assertSame([], Storage::disk('public')->allFiles());
    }
}
