<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['app' => 'Shija API']));
Route::prefix('api/v1')->group(function () {
    Route::get('cities', fn () => response()->json(['data' => config('delivery.cities')]));
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:20,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:20,1');
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('user', [AuthController::class, 'show']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});
