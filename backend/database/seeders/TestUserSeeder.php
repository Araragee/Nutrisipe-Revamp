<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update a standard test user
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'remember_token' => Str::random(10),
                'is_admin' => false,
                'google_id' => 'dev_test_user_id',
                'image' => 'https://ui-avatars.com/api/?name=Test+User&background=random',
            ]
        );
        
        // Create an admin test user as well
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'remember_token' => Str::random(10),
                'is_admin' => true,
                'google_id' => 'dev_admin_user_id',
                'image' => 'https://ui-avatars.com/api/?name=Admin+User&background=random',
            ]
        );
    }
}
