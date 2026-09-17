<?php

namespace Tests\Unit;

use App\Support\OrderTotal;
use PHPUnit\Framework\TestCase;

class OrderTotalTest extends TestCase
{
    public function test_calculates_multiple_items_in_integer_cents(): void
    {
        $this->assertSame(['subtotal_cents' => 2245, 'delivery_fee_cents' => 150, 'total_cents' => 2395], OrderTotal::calculate([['price_cents' => 650, 'quantity' => 2], ['price_cents' => 315, 'quantity' => 3]], 150));
    }

    public function test_empty_cart_has_no_delivery_charge(): void
    {
        $this->assertSame(['subtotal_cents' => 0, 'delivery_fee_cents' => 0, 'total_cents' => 0], OrderTotal::calculate([], 150));
    }
}
