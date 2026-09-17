<?php

namespace App\Http\Controllers;

use App\Http\Resources\RestaurantResource;
use App\Models\Restaurant;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RestaurantController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return RestaurantResource::collection(Restaurant::where('is_active', true)->with(['foods' => fn ($q) => $q->where('is_available', true)->orderBy('id')])->orderBy('id')->get());
    }

    public function show(Restaurant $restaurant): RestaurantResource
    {
        abort_unless($restaurant->is_active, 404);

        return new RestaurantResource($restaurant->load(['foods' => fn ($q) => $q->where('is_available', true)->orderBy('id')]));
    }
}
