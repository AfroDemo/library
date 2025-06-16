<?php

use App\Http\Controllers\BookController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StudentController;
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

    Route::get('/students/{member_id}', [TransactionController::class, 'getStudent']);
    Route::get('/books/{isbn}', [TransactionController::class, 'getBook']);
    Route::post('/transactions', [TransactionController::class, 'store']);

    Route::middleware(['role:librarian,admin'])->group(function () {
        // Librarian Dashboard
        Route::get('/librarian/dashboard', function () {
            return Inertia::render('librarian/dashboard');
        })->name('librarian.dashboard');

        // Book Management
        Route::resource('books', BookController::class);

        // Student Management
        Route::resource('students', StudentController::class);

        // Transaction Management
        Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');

        // Returns page
        Route::get('/librarian/returns', function () {
            return Inertia::render('librarian/returns');
        })->name('librarian.returns');

        // Overdue books page
        Route::get('/librarian/overdue', function () {
            return Inertia::render('librarian/overdue');
        })->name('librarian.overdue');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
