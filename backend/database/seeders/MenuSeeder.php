<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $menus = [
            ['Casa di Pasta', 'Italian', 'A little Italy, a lot of love. Stone-baked pizzas and comforting pasta, made fresh every day.', 'pizza', 30, 150, [
                ['Margherita', 'San Marzano tomato, fresh mozzarella, basil & extra virgin olive oil.', 'Pizza', 650, 'margherita'],
                ['Diavola', 'Spicy salami, mozzarella, tomato & a little fiery kick.', 'Pizza', 800, 'diavola'],
                ['Creamy Carbonara', 'Spaghetti, smoked beef, egg yolk & aged Parmesan.', 'Pasta', 750, 'carbonara'],
                ['Pesto Primavera', 'Penne, basil pesto, cherry tomatoes & Parmesan.', 'Pasta', 700, 'pesto-primavera'],
                ['Burrata Salad', 'Creamy burrata, seasonal tomatoes, rocket & balsamic.', 'Sides', 550, 'burrata-salad'],
                ['Tiramisu', 'Espresso-soaked layers with mascarpone and cocoa.', 'Desserts', 350, 'tiramisu']]],
            ['Burger Theory', 'Burgers', 'Big bites. Better moods. Juicy smashed burgers, golden fries and all the good stuff.', 'burger', 25, 100, [
                ['The Classic Smash', 'Double smashed beef, cheddar, pickles & our house sauce.', 'Burgers', 650, 'classic-smash'],
                ['Smoky BBQ Burger', 'Flame-grilled beef, smoked cheese, crispy onion & BBQ sauce.', 'Burgers', 750, 'smoky-bbq-burger'],
                ['Crispy Chicken', 'Crispy chicken breast, crunchy slaw & garlic mayo.', 'Burgers', 600, 'crispy-chicken-burger'],
                ['Garden Burger', 'Chickpea patty, avocado, lettuce & herby yogurt.', 'Burgers', 600, 'garden-burger'],
                ['Loaded Fries', 'Golden fries, melted cheddar & house sauce.', 'Sides', 350, 'loaded-fries'],
                ['Chocolate Brownie', 'Warm chocolate brownie with a rich, fudgy center.', 'Desserts', 300, 'chocolate-brownie']]],
            ['Kebab House', 'Kebab', 'Straight from the grill. Fresh flatbreads, fragrant spices and generous plates to love.', 'kebab', 20, 100, [
                ['Chicken Döner', 'Spiced chicken, fresh salad & garlic sauce in warm flatbread.', 'Wraps', 450, 'chicken-doner'],
                ['Beef Döner', 'Slow-roasted beef, red cabbage, tomatoes & house sauce.', 'Wraps', 500, 'beef-doner'],
                ['Mixed Grill Plate', 'Chicken & beef kebab, rice, grilled vegetables & warm bread.', 'Plates', 850, 'mixed-grill'],
                ['Falafel Wrap', 'Crispy chickpea falafel, hummus, salad & tahini.', 'Wraps', 400, 'falafel-wrap'],
                ['Hummus & Pita', 'Silky hummus with olive oil, paprika & warm pita bread.', 'Sides', 300, 'hummus-pita'],
                ['Baklava', 'Golden filo pastry, pistachios & a light honey syrup.', 'Desserts', 250, 'baklava']]],
        ];
        foreach ($menus as [$name,$cuisine,$description,$image,$minutes,$fee,$foods]) {
            $restaurant = Restaurant::updateOrCreate(['name' => $name], ['cuisine' => $cuisine, 'description' => $description, 'image_url' => '/images/'.$image.'.jpg', 'delivery_minutes' => $minutes, 'delivery_fee_cents' => $fee]);
            foreach ($foods as [$food,$description,$category,$price,$image]) {
                $restaurant->foods()->updateOrCreate(['name' => $food], ['description' => $description, 'category' => $category, 'price_cents' => $price, 'image_url' => '/images/'.$image.'.jpg']);
            }
        }
    }
}
