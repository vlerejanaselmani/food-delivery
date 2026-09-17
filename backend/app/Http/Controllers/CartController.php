<?php

namespace App\Http\Controllers;

use App\Models\Food;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    public function show(Request $request, CartService $cart): JsonResponse
    {
        return response()->json(['data' => $cart->read($request)]);
    }

    public function store(Request $request, CartService $service): JsonResponse
    {
        $data = $request->validate(['food_id' => ['required', 'integer', 'exists:food,id'], 'quantity' => ['required', 'integer', 'min:1', 'max:20']]);
        $food = Food::with('restaurant')->findOrFail($data['food_id']);
        if (! $food->is_available || ! $food->restaurant->is_active) {
            throw ValidationException::withMessages(['food_id' => 'This item is currently unavailable.']);
        }
        $cart = $request->session()->get('cart', []);
        $existing = Food::whereIn('id', array_keys($cart))->first();
        if ($existing && $existing->restaurant_id !== $food->restaurant_id) {
            return response()->json(['message' => 'Your cart belongs to another restaurant. Clear it to start a new order.'], 409);
        }
        $quantity = ($cart[$food->id] ?? 0) + $data['quantity'];
        if ($quantity > 20) {
            throw ValidationException::withMessages(['quantity' => 'You can add up to 20 of each item.']);
        }
        $cart[$food->id] = $quantity;
        $request->session()->put('cart', $cart);

        return response()->json(['data' => $service->read($request)]);
    }

    public function update(Request $request, int $food, CartService $service): JsonResponse
    {
        $data = $request->validate(['quantity' => ['required', 'integer', 'min:1', 'max:20']]);
        $cart = $request->session()->get('cart', []);
        abort_unless(isset($cart[$food]), 404);
        $cart[$food] = $data['quantity'];
        $request->session()->put('cart', $cart);

        return response()->json(['data' => $service->read($request)]);
    }

    public function destroy(Request $request, int $food, CartService $service): JsonResponse
    {
        $cart = $request->session()->get('cart', []);
        unset($cart[$food]);
        $request->session()->put('cart', $cart);

        return response()->json(['data' => $service->read($request)]);
    }

    public function clear(Request $request, CartService $service): JsonResponse
    {
        $service->clear($request);

        return response()->json(['data' => $service->read($request)]);
    }
}
