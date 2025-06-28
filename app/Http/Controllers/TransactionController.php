<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Student;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class TransactionController extends Controller
{
    // Get student by member_id (used by /api/students/{id})
    public function getStudent(Request $request, $id)
    {
        $student = Student::where('member_id', $id)->with('user')->first();
        if (!$student) {
            return response()->json(['error' => 'Student not found'], 404);
        }
        return response()->json([
            'member_id' => $student->member_id, // Map member_id to member_id for frontend
            'name' => $student->user->name,
            'email' => $student->user->email,
        ]);
    }

    // Get book by ISBN (used by /api/books/{isbn})
    public function getBook(Request $request, $isbn)
    {
        $book = Book::where('isbn', $isbn)->first();
        if (!$book) {
            return response()->json(['error' => 'Book not found'], 404);
        }
        return response()->json([
            'isbn' => $book->isbn,
            'title' => $book->title,
            'author' => $book->author,
            'available' => $book->available,
        ]);
    }

    // Store a new transaction (used by /api/transactions)
    public function store(Request $request)
    {

        Log::debug($request);
        $request->validate([
            'member_id' => 'required|string',
            'book_isbn' => 'required|string',
        ]);

        $memberId = $request->input('member_id');
        $bookIsbn = $request->input('book_isbn');

        Log::info('Processing borrow confirmation:', ['member_id' => $memberId, 'book_isbn' => $bookIsbn]);

        $student = session('student');
        $book = session('book');

        if (!$student || $student['member_id'] !== $memberId) {
            Log::error('Invalid or missing student in session:', ['member_id' => $memberId]);
            return redirect()->route('dashboard')->withErrors(['scan_input' => 'Invalid student data']);
        }

        if (!$book || $book['isbn'] !== $bookIsbn) {
            Log::error('Invalid or missing book in session:', ['book_isbn' => $bookIsbn]);
            return redirect()->route('dashboard')->withErrors(['scan_input' => 'Invalid book data']);
        }

        $studentModel = Student::where('member_id', $memberId)->first();
        if (!$studentModel) {
            Log::error('Student not found in database:', ['member_id' => $memberId]);
            return redirect()->route('dashboard')->withErrors(['scan_input' => 'Student not found']);
        }

        $bookModel = Book::where('isbn', $bookIsbn)->first();
        if (!$bookModel) {
            Log::error('Book not found in database:', ['book_isbn' => $bookIsbn]);
            return redirect()->route('dashboard')->withErrors(['scan_input' => 'Book not found']);
        }

        if (!$bookModel->available) {
            Log::error('Book not available:', ['book_isbn' => $bookIsbn]);
            return redirect()->route('dashboard')->withErrors(['scan_input' => 'Book is not available']);
        }

        // Create transaction
        Transaction::create([
            'user_id' => $studentModel->id,
            'book_id' => $bookModel->id,
            'borrowed_at' => now(),
            'due_date' => now()->addDays(14),
        ]);

        $bookModel->update(['available' => false]);

        // Clear session data after successful transaction
        session()->forget(['student', 'scan_step', 'book']);

        Log::info('Transaction created, resetting scan_step to student');
        return redirect()->route('dashboard')->with([
            'scan_step' => 'student',
            'success' => "Book \"{$bookModel->title}\" borrowed successfully",
        ]);
    }

    // Return a book
    public function returnBook(Request $request, Transaction $transaction)
    {
        if ($transaction->returned_at) {
            return response()->json(['error' => 'Book already returned'], 400);
        }

        $transaction->update([
            'returned_at' => Carbon::now(),
        ]);

        $transaction->book->update(['available' => true]);

        return response()->json([
            'message' => 'Book returned successfully',
            'transaction' => $transaction->load(['user', 'book']),
        ]);
    }

    // List transactions for Inertia rendering
    public function index(Request $request)
    {
        $query = Transaction::with(['user', 'book'])->orderBy('borrowed_at', 'desc');

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

        return Inertia::render('librarian/transactions', [
            'transactions' => $transactions,
            'filters' => $request->only(['status']),
        ]);
    }

    // Returns page: show all active (not returned) transactions for returns UI
    public function returnsPage(Request $request)
    {
        $activeTransactions = Transaction::with(['user', 'book'])
            ->whereNull('returned_at')
            ->orderBy('borrowed_at', 'desc')
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'borrowed_at' => $t->borrowed_at,
                    'due_date' => $t->due_date,
                    'returned_at' => $t->returned_at,
                    'student_name' => $t->user ? $t->user->name : '',
                    'member_id' => $t->user && $t->user->student ? $t->user->student->member_id : '',
                    'book_title' => $t->book ? $t->book->title : '',
                    'book_isbn' => $t->book ? $t->book->isbn : '',
                ];
            });
        return Inertia::render('librarian/returns', [
            'activeTransactions' => $activeTransactions,
        ]);
    }

    // Process a return (POST)
    public function processReturn(Request $request)
    {
        $request->validate([
            'transaction_id' => 'required|integer|exists:transactions,id',
        ]);
        $transaction = Transaction::with('book')->findOrFail($request->transaction_id);
        if ($transaction->returned_at) {
            return redirect()->back()->withErrors(['transaction_id' => 'Book already returned.']);
        }
        $transaction->update([
            'returned_at' => Carbon::now(),
        ]);
        if ($transaction->book) {
            $transaction->book->update(['available' => true]);
        }
        return redirect()->route('librarian.returns')->with('success', 'Book returned successfully!');
    }
}
