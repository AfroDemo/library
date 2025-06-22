<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Student;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
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
            'student_id' => $student->member_id, // Map member_id to student_id for frontend
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
        $request->validate([
            'student_id' => 'required|exists:students,member_id', // Expect student_id but validate against member_id
            'isbn' => 'required|exists:books,isbn',
        ]);

        $student = Student::where('member_id', $request->student_id)->first();
        $book = Book::where('isbn', $request->isbn)->first();

        if (!$book->available) {
            return response()->json(['error' => 'Book not available'], 400);
        }

        $transaction = Transaction::create([
            'user_id' => $student->user_id,
            'book_id' => $book->id,
            'borrowed_at' => Carbon::now(),
            'due_date' => Carbon::now()->addDays(14),
        ]);

        $book->update(['available' => false]);

        return response()->json([
            'message' => 'Book borrowed successfully',
            'transaction' => $transaction->load(['user', 'book']),
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

        return Inertia::render('librarian/transactions/index', [
            'transactions' => $transactions,
            'filters' => $request->only(['status']),
        ]);
    }
}
