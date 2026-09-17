<?php

namespace App\Http\Controllers;

use App\Http\Resources\FoodResource;
use App\Http\Resources\RestaurantResource;
use App\Models\Food;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['foods' => FoodResource::collection($request->user()->favoriteFoods()->with('restaurant')->where('is_available', true)->whereHas('restaurant', fn ($q) => $q->where('is_active', true))->orderBy('food.id')->get()), 'restaurants' => RestaurantResource::collection($request->user()->favoriteRestaurants()->where('is_active', true)->orderBy('restaurants.id')->get())]);
    }

    public function store(Request $request, string $type, int $id): JsonResponse
    {
        $relation = $this->relation($type);
        $model = $type === 'foods' ? Food::class : Restaurant::class;
        $model::findOrFail($id);
        $request->user()->$relation()->syncWithoutDetaching([$id]);

        return response()->json(['message' => 'Saved to favorites.']);
    }

    public function destroy(Request $request, string $type, int $id): JsonResponse
    {
        $relation = $this->relation($type);
        $request->user()->$relation()->detach($id);

        return response()->json(['message' => 'Removed from favorites.']);
    }

    private function relation(string $type): string
    {
        abort_unless(in_array($type, ['foods', 'restaurants']), 404);

        return $type === 'foods' ? 'favoriteFoods' : 'favoriteRestaurants';
    }
}
