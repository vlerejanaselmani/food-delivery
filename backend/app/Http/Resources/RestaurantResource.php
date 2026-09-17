<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestaurantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'cuisine' => $this->cuisine, 'description' => $this->description, 'image_url' => $this->image_url, 'delivery_fee_cents' => $this->delivery_fee_cents, 'delivery_minutes' => $this->delivery_minutes, 'is_active' => $this->is_active, 'foods' => FoodResource::collection($this->whenLoaded('foods'))];
    }
}
