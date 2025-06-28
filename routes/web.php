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

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/students/{member_id}', [TransactionController::class, 'getStudent']);
    Route::get('/books/{isbn}', [TransactionController::class, 'getBook']);
    Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');

    Route::middleware(['role:librarian,admin'])->group(function () {
        Route::post('/dashboard/scan', [DashboardController::class, 'handleScan'])->name('librarian.scan');
        Route::get('/students', [StudentController::class, 'index'])->name('students.index');
        Route::get('/books', [BookController::class, 'index'])->name('books.index');

        // Book Management
        Route::resource('books', BookController::class);

        // Student Management
        Route::resource('students', StudentController::class);

        // Transaction Management
        Route::post('/transactions', [TransactionController::class, 'store'])->name('librarian.confirm-borrow');

        // Returns page
        Route::get('/librarian/returns', function () {
            return Inertia::render('librarian/returns');
        })->name('librarian.returns');

        // Overdue books page
        Route::get('/librarian/overdue', function () {
            return Inertia::render('librarian/overdue');
        })->name('librarian.overdue');

        //Transactions
        Route::get('/librarian/transactions', [TransactionController::class, 'index'])->name('librarian.transactions');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
