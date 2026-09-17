<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'reference' => $this->reference, 'restaurant_name' => $this->restaurant_name, 'customer_name' => $this->customer_name, 'city' => $this->city, 'phone' => $this->phone, 'notes' => $this->notes, 'status' => $this->status, 'subtotal_cents' => $this->subtotal_cents, 'delivery_fee_cents' => $this->delivery_fee_cents, 'total_cents' => $this->total_cents, 'created_at' => $this->created_at, 'items' => $this->whenLoaded('items')];
    }
}
