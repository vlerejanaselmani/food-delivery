<?php

namespace App\Http\Requests;

use App\Support\KosovoPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['phone' => KosovoPhone::normalize((string) $this->phone), 'email' => strtolower((string) $this->email)]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'], 'email' => ['required', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:6', 'max:128'], 'city' => ['required', Rule::in(config('delivery.cities'))],
            'phone' => ['required', 'regex:/^\\+383[0-9]{8,9}$/'],
        ];
    }
}
