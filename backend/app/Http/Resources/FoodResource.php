<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FoodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'restaurant_id' => $this->restaurant_id, 'name' => $this->name, 'description' => $this->description, 'category' => $this->category, 'price_cents' => $this->price_cents, 'image_url' => $this->image_url, 'is_available' => $this->is_available];
    }
}
