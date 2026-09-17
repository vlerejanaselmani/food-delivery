<?php

namespace App\Services;

use App\Models\Food;
use App\Support\OrderTotal;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CartService
{
    public function read(Request $request, bool $lock = false): array
    {
        $cart = $request->session()->get('cart', []);
        $query = Food::with('restaurant')->whereIn('id', array_keys($cart));
        if ($lock) {
            $query->lockForUpdate();
        }
        $foods = $query->get();
        $items = [];
        foreach ($foods as $food) {
            $items[] = ['food_id' => $food->id, 'name' => $food->name, 'image_url' => $food->image_url, 'price_cents' => $food->price_cents, 'quantity' => (int) $cart[$food->id], 'is_available' => $food->is_available && $food->restaurant->is_active];
        }
        $restaurant = $foods->first()?->restaurant;
        if (! $request->session()->has('checkout_key')) {
            $request->session()->put('checkout_key', (string) Str::uuid());
        }

        return ['items' => $items, 'restaurant' => $restaurant, 'checkout_key' => $request->session()->get('checkout_key'), 'missing_items' => count($cart) !== count($items) || $foods->pluck('restaurant_id')->unique()->count() > 1, ...OrderTotal::calculate($items, $restaurant?->delivery_fee_cents ?? 0)];
    }

    public function clear(Request $request): void
    {
        $request->session()->forget(['cart', 'checkout_key']);
    }
}
