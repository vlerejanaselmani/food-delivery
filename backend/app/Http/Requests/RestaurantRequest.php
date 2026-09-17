<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RestaurantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:100'], 'cuisine' => ['required', Rule::in(['Italian', 'Burgers', 'Kebab', 'Other'])], 'description' => ['required', 'string', 'max:1000'], 'image_url' => ['required', 'string', 'max:1000', 'regex:~^(https://|/images/)[^\s]+$~'], 'delivery_fee_cents' => ['required', 'integer', 'min:0', 'max:10000'], 'delivery_minutes' => ['required', 'integer', 'min:5', 'max:180'], 'is_active' => ['required', 'boolean']];
    }
}
