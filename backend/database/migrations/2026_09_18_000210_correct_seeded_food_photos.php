<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const PHOTOS = [
        ['Casa di Pasta', 'Margherita', 'pizza', 'margherita'],
        ['Casa di Pasta', 'Diavola', 'pizza', 'diavola'],
        ['Casa di Pasta', 'Creamy Carbonara', 'pasta', 'carbonara'],
        ['Casa di Pasta', 'Pesto Primavera', 'pasta', 'pesto-primavera'],
        ['Casa di Pasta', 'Burrata Salad', 'salad', 'burrata-salad'],
        ['Casa di Pasta', 'Tiramisu', 'dessert', 'tiramisu'],
        ['Burger Theory', 'The Classic Smash', 'burger', 'classic-smash'],
        ['Burger Theory', 'Smoky BBQ Burger', 'burger', 'smoky-bbq-burger'],
        ['Burger Theory', 'Crispy Chicken', 'chicken', 'crispy-chicken-burger'],
        ['Burger Theory', 'Garden Burger', 'salad', 'garden-burger'],
        ['Burger Theory', 'Loaded Fries', 'fries', 'loaded-fries'],
        ['Burger Theory', 'Chocolate Brownie', 'dessert', 'chocolate-brownie'],
        ['Kebab House', 'Chicken Döner', 'kebab', 'chicken-doner'],
        ['Kebab House', 'Beef Döner', 'kebab', 'beef-doner'],
        ['Kebab House', 'Mixed Grill Plate', 'grill', 'mixed-grill'],
        ['Kebab House', 'Falafel Wrap', 'salad', 'falafel-wrap'],
        ['Kebab House', 'Hummus & Pita', 'hummus', 'hummus-pita'],
        ['Kebab House', 'Baklava', 'dessert', 'baklava'],
    ];

    public function up(): void
    {
        $this->replacePhotos(false);
    }

    public function down(): void
    {
        $this->replacePhotos(true);
    }

    private function replacePhotos(bool $reverse): void
    {
        foreach (self::PHOTOS as [$restaurant, $name, $old, $new]) {
            DB::table('food')
                ->whereIn('restaurant_id', DB::table('restaurants')->select('id')->where('name', $restaurant))
                ->where('name', $name)
                ->where('image_url', '/images/'.($reverse ? $new : $old).'.jpg')
                ->update(['image_url' => '/images/'.($reverse ? $old : $new).'.jpg']);
        }
    }
};
