<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::get('dashboard', function () {
//         return Inertia::render('dashboard');
//     })->name('dashboard');
// });

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/students/{student_id}', [TransactionController::class, 'getStudent']);
    Route::get('/books/{isbn}', [TransactionController::class, 'getBook']);
    Route::post('/transactions', [TransactionController::class, 'store']);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
