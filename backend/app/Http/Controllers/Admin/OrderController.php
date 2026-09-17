<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $data = $request->validate(['status' => ['nullable', Rule::in(Order::STATUSES)]]);

        return OrderResource::collection(Order::with('items')->when($data['status'] ?? null, fn ($q, $status) => $q->where('status', $status))->latest('id')->paginate(20));
    }

    public function update(Request $request, Order $order): OrderResource
    {
        $data = $request->validate(['status' => ['required', Rule::in(Order::STATUSES)]]);
        $order->update($data);

        return new OrderResource($order->load('items'));
    }
}
