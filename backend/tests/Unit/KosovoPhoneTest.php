<?php

namespace Tests\Unit;

use App\Support\KosovoPhone;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class KosovoPhoneTest extends TestCase
{
    public static function numbers(): array
    {
        return [['044 123 456'], ['+383 44 123 456'], ['00383 44 123 456'], ['44-123-456']];
    }

    #[DataProvider('numbers')]
    public function test_normalizes_common_kosovo_phone_formats(string $input): void
    {
        $this->assertSame('+38344123456', KosovoPhone::normalize($input));
    }
}
