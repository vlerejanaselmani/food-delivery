<?php

use App\Http\Controllers\Admin\FoodController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\RestaurantController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['app' => 'Shija API']));
Route::prefix('api/v1')->group(function () {
    Route::get('cart', [CartController::class, 'show'])->block();
    Route::post('cart/items', [CartController::class, 'store'])->block();
    Route::patch('cart/items/{food}', [CartController::class, 'update'])->block();
    Route::delete('cart/items/{food}', [CartController::class, 'destroy'])->block();
    Route::delete('cart', [CartController::class, 'clear'])->block();
    Route::post('orders', [OrderController::class, 'store'])->block();

    Route::apiResource('restaurants', RestaurantController::class)->only(['index', 'show']);
    Route::get('cities', fn () => response()->json(['data' => config('delivery.cities')]));
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:20,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:20,1');
    Route::middleware('auth:sanctum')->group(function () {
        Route::prefix('admin')->middleware('admin')->group(function () {
            Route::apiResource('restaurants', App\Http\Controllers\Admin\RestaurantController::class)->except(['show']);
            Route::apiResource('foods', FoodController::class)->only(['store', 'update', 'destroy']);
            Route::apiResource('orders', App\Http\Controllers\Admin\OrderController::class)->only(['index', 'update']);
        });

        Route::get('orders', [OrderController::class, 'index']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
        Route::get('favorites', [FavoriteController::class, 'index']);
        Route::put('favorites/{type}/{id}', [FavoriteController::class, 'store']);
        Route::delete('favorites/{type}/{id}', [FavoriteController::class, 'destroy']);

        Route::get('user', [AuthController::class, 'show']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});
