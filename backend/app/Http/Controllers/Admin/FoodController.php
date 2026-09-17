<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\FoodRequest;
use App\Http\Resources\FoodResource;
use App\Models\Food;
use Illuminate\Http\Response;

class FoodController extends Controller
{
    public function store(FoodRequest $request): FoodResource
    {
        return new FoodResource(Food::create($request->validated()));
    }

    public function update(FoodRequest $request, Food $food): FoodResource
    {
        $food->update($request->validated());

        return new FoodResource($food);
    }

    public function destroy(Food $food): Response
    {
        $food->delete();

        return response()->noContent();
    }
}
