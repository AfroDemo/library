<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Student;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;

class LibrarianController extends Controller
{
    public function dashboardStats()
    {
        $today = Carbon::today();

        $stats = [
            'totalBooks' => Book::count(),
            'availableBooks' => Book::where('available', true)->count(),
            'borrowedBooks' => Book::where('available', false)->count(),
            'totalStudents' => Student::count(),
            'totalTransactions' => Transaction::whereDate('borrowed_at', $today)->count(),
            'overdueBooks' => Transaction::whereNull('returned_at')
                ->where('due_date', '<', $today)
                ->count(),
            'activeTransactions' => Transaction::whereNull('returned_at')->count(),
        ];

        return response()->json($stats);
    }

    public function transactions(Request $request)
    {
        $query = Transaction::with(['user', 'book'])
            ->orderBy('borrowed_at', 'desc');

        if ($request->has('status')) {
            if ($request->status === 'active') {
                $query->whereNull('returned_at');
            } elseif ($request->status === 'returned') {
                $query->whereNotNull('returned_at');
            } elseif ($request->status === 'overdue') {
                $query->whereNull('returned_at')
                    ->where('due_date', '<', Carbon::today());
            }
        }

        $transactions = $query->paginate(20);

        return response()->json($transactions);
    }

    public function overdueBooks()
    {
        $overdueTransactions = Transaction::with(['user', 'book'])
            ->whereNull('returned_at')
            ->where('due_date', '<', Carbon::today())
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json($overdueTransactions);
    }
}
