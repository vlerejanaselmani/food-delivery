<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateAdminRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminController extends Controller
{
    public function store(CreateAdminRequest $request): JsonResponse
    {
        $admin = new User($request->validated());
        $admin->role = 'admin';
        $admin->save();

        return response()->json(['user' => $admin], 201);
    }
}
