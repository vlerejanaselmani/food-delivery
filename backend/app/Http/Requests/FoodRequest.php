<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FoodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return ['restaurant_id' => ['required', 'integer', 'exists:restaurants,id'], 'name' => ['required', 'string', 'max:100'], 'description' => ['required', 'string', 'max:1000'], 'category' => ['required', 'string', 'max:60'], 'price_cents' => ['required', 'integer', 'min:1', 'max:100000'], 'image_url' => ['required', 'string', 'max:1000', 'regex:~^(https://|/images/|/storage/food-images/)[^\s]+$~'], 'is_available' => ['required', 'boolean']];
    }
}
