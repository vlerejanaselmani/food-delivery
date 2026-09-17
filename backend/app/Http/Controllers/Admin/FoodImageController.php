<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FoodImageController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate(['image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'dimensions:min_width=1,min_height=1', 'max:5120']]);
        $path = $request->file('image')->store('food-images', 'public');
        abort_if($path === false, 500, 'The photo could not be saved. Please try again.');

        return response()->json(['image_url' => '/storage/'.$path], 201);
    }
}
