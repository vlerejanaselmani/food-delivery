<?php

namespace App\Support;

class OrderTotal
{
    public static function calculate(array $items, int $deliveryFee): array
    {
        $subtotal = 0;
        foreach ($items as $item) {
            $subtotal += $item['price_cents'] * $item['quantity'];
        }

        return ['subtotal_cents' => $subtotal, 'delivery_fee_cents' => $items ? $deliveryFee : 0, 'total_cents' => $subtotal + ($items ? $deliveryFee : 0)];
    }
}
