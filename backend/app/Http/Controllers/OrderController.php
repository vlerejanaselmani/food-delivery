<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return OrderResource::collection(Order::where('user_id', $request->user()->id)->with('items')->latest('id')->paginate(20));
    }

    public function show(Request $request, int $order): OrderResource
    {
        return new OrderResource(Order::where('user_id', $request->user()->id)->with('items')->findOrFail($order));
    }

    public function store(CheckoutRequest $request, CartService $service): OrderResource
    {
        $data = $request->validated();
        $last = $request->session()->get('last_order');
        if ($last && $last['key'] === $data['checkout_key']) {
            return new OrderResource(Order::with('items')->findOrFail($last['id']));
        }
        if ($data['checkout_key'] !== $request->session()->get('checkout_key')) {
            throw ValidationException::withMessages(['cart' => 'Your cart has changed. Please review it and try again.']);
        }
        $order = DB::transaction(function () use ($request, $service, $data) {
            $cart = $service->read($request, true);
            if (! $cart['items'] || $cart['missing_items']) {
                throw ValidationException::withMessages(['cart' => 'Your cart is empty or contains a removed item. Please update it.']);
            }
            foreach ($cart['items'] as $item) {
                if (! $item['is_available']) {
                    throw ValidationException::withMessages(['cart' => $item['name'].' is no longer available. Remove it to continue.']);
                }
            }
            $order = Order::create([...$data, 'reference' => (string) Str::uuid(), 'user_id' => $request->user()?->id, 'restaurant_id' => $cart['restaurant']->id, 'restaurant_name' => $cart['restaurant']->name, 'status' => 'new', 'subtotal_cents' => $cart['subtotal_cents'], 'delivery_fee_cents' => $cart['delivery_fee_cents'], 'total_cents' => $cart['total_cents']]);
            foreach ($cart['items'] as $item) {
                $order->items()->create(collect($item)->only(['food_id', 'name', 'price_cents', 'quantity'])->all());
            }

            return $order;
        });
        $request->session()->put('last_order', ['key' => $data['checkout_key'], 'id' => $order->id]);
        $service->clear($request);

        return new OrderResource($order->load('items'));
    }
}
