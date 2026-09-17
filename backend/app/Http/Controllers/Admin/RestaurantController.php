<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\RestaurantRequest;
use App\Http\Resources\RestaurantResource;
use App\Models\Restaurant;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class RestaurantController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return RestaurantResource::collection(Restaurant::with('foods')->orderBy('id')->get());
    }

    public function store(RestaurantRequest $request): RestaurantResource
    {
        return new RestaurantResource(Restaurant::create($request->validated()));
    }

    public function update(RestaurantRequest $request, Restaurant $restaurant): RestaurantResource
    {
        $restaurant->update($request->validated());

        return new RestaurantResource($restaurant);
    }

    public function destroy(Restaurant $restaurant): Response
    {
        $restaurant->delete();

        return response()->noContent();
    }
}
