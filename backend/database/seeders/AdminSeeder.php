<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        if (! config('delivery.admin_password')) {
            return;
        }
        $user = User::firstOrNew(['email' => config('delivery.admin_email')]);
        $user->forceFill(['name' => 'Shija Admin', 'role' => 'admin', 'password' => config('delivery.admin_password'), 'city' => 'Prishtinë', 'phone' => '+38344123456'])->save();
    }
}
