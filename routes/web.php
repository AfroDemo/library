<?php

use App\Http\Controllers\AdminController;
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

    Route::get('/user/history', [TransactionController::class, 'userTransactions'])->name('user.transactions');
    Route::get('/user/search', [BookController::class, 'getBooks'])->name('books.search');

    Route::get('/students/{member_id}', [TransactionController::class, 'getStudent']);
    Route::get('/books/{isbn}', [TransactionController::class, 'getBook']);
    Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::post('/transactions/extension', [TransactionController::class, 'requestExtension']);

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
        Route::get('/librarian/returns', [TransactionController::class, 'returnsPage'])->name('librarian.returns');

        // Process a return
        Route::post('/librarian/returns/process', [TransactionController::class, 'processReturn'])->name('librarian.returns.process');

        // Overdue books page
        Route::get('/librarian/overdue', [TransactionController::class, 'overduePage'])->name('librarian.overdue');

        // Send reminders for overdue books
        Route::post('/librarian/overdue/send-reminders', [TransactionController::class, 'sendOverdueReminders'])->name('librarian.overdue.sendReminders');

        // Transactions
        Route::get('/librarian/transactions', [TransactionController::class, 'index'])->name('librarian.transactions');
        Route::post('/librarian/clearance', [DashboardController::class, 'checkClearance'])
            ->name('librarian.clearance');

        // Extension Requests
        Route::get('/librarian/extension-requests', [TransactionController::class, 'extensionRequests'])->name('librarian.extension-requests');
    });

    Route::middleware(['role:admin'])->prefix('admin')->group(function () {
        // Books Management
        Route::get('/books', [AdminController::class, 'booksIndex'])->name('admin.books.index');
        Route::post('/books', [AdminController::class, 'booksStore'])->name('admin.books.store');
        Route::put('/books/{book}', [AdminController::class, 'booksUpdate'])->name('admin.books.update');
        Route::delete('/books/{book}', [AdminController::class, 'booksDestroy'])->name('admin.books.destroy');

        // Users Management
        Route::get('/users', [AdminController::class, 'usersIndex'])->name('admin.users.index');
        Route::post('/users', [AdminController::class, 'usersStore'])->name('admin.users.store');
        Route::put('/users/{user}', [AdminController::class, 'usersUpdate'])->name('admin.users.update');
        Route::delete('/users/{user}', [AdminController::class, 'usersDestroy'])->name('admin.users.destroy');

        // Librarians Management
        Route::get('/librarians', [AdminController::class, 'librariansIndex'])->name('admin.librarians.index');
        Route::post('/librarians', [AdminController::class, 'librariansStore'])->name('admin.librarians.store');
        Route::put('/librarians/{user}', [AdminController::class, 'librariansUpdate'])->name('admin.librarians.update');
        Route::delete('/librarians/{user}', [AdminController::class, 'librariansDestroy'])->name('admin.librarians.destroy');

        // Settings Management
        Route::get('/settings', [AdminController::class, 'settingsIndex'])->name('admin.settings.index');
        Route::post('/settings', [AdminController::class, 'settingsUpdate'])->name('admin.settings.update');

        // Shelves Management
        Route::get('/location', [AdminController::class, 'shelvesIndex'])->name('admin.shelves.index');
        Route::post('/location', [AdminController::class, 'shelvesStore'])->name('admin.shelves.store');
        Route::put('/location/{shelf}', [AdminController::class, 'shelvesUpdate'])->name('admin.shelves.update');
        Route::delete('/location/{shelf}', [AdminController::class, 'shelvesDestroy'])->name('admin.shelves.destroy');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
