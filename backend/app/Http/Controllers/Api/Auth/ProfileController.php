<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    /** PATCH /api/auth/me — nama, email, telepon milik sendiri. */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return (new UserResource($user->load('bagian')))
            ->additional(['message' => 'Profil berhasil diperbarui.'])
            ->response();
    }

    /** PATCH /api/auth/password */
    public function password(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        // Cast 'hashed' pada model meng-hash sandi baru. Token "ingat saya" diputar supaya
        // perangkat lain yang masih menyimpan cookie remember tidak bisa masuk lagi.
        $user->forceFill([
            'password' => $request->validated('password'),
            'remember_token' => Str::random(60),
        ])->save();

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json(['message' => 'Kata sandi berhasil diubah.']);
    }
}
