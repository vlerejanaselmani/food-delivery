<?php

namespace App\Http\Requests;

use App\Support\KosovoPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['phone' => KosovoPhone::normalize((string) $this->phone)]);
    }

    public function rules(): array
    {
        return ['customer_name' => ['required', 'string', 'max:100'], 'city' => ['required', Rule::in(config('delivery.cities'))], 'phone' => ['required', 'regex:/^\+383[0-9]{8,9}$/'], 'notes' => ['nullable', 'string', 'max:500'], 'checkout_key' => ['required', 'uuid']];
    }
}
