<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    public const STATUSES = ['new', 'processing', 'on the way', 'done'];

    protected $fillable = ['reference', 'checkout_key', 'user_id', 'restaurant_id', 'restaurant_name', 'customer_name', 'city', 'phone', 'notes', 'status', 'subtotal_cents', 'delivery_fee_cents', 'total_cents'];

    protected $hidden = ['checkout_key'];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
