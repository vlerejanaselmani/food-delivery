<?php

namespace App\Support;

class KosovoPhone
{
    public static function normalize(string $value): string
    {
        $digits = preg_replace('/[^0-9]/', '', $value);
        if (str_starts_with($digits, '00383')) {
            $digits = substr($digits, 2);
        }
        if (str_starts_with($digits, '0')) {
            $digits = '383'.substr($digits, 1);
        }
        if (! str_starts_with($digits, '383')) {
            $digits = '383'.$digits;
        }

        return '+'.$digits;
    }
}
