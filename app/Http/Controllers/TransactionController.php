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
    public function getStudent(Request $request, $student_id)
    {
        $student = Student::where('student_id', $student_id)->with('user')->first();
        if (!$student) {
            return response()->json(['error' => 'Student not found'], 404);
        }
        return response()->json($student);
    }

    public function getBook(Request $request, $isbn)
    {
        $book = Book::where('isbn', $isbn)->first();
        if (!$book) {
            return response()->json(['error' => 'Book not found'], 404);
        }
        return response()->json($book);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,student_id',
            'isbn' => 'required|exists:books,isbn',
        ]);

        $student = Student::where('student_id', $request->student_id)->first();
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

        return response()->json(['message' => 'Book borrowed successfully', 'transaction' => $transaction]);
    }

    public function returnBook(Request $request, Transaction $transaction)
    {
        if ($transaction->returned_at) {
            return response()->json(['error' => 'Book already returned'], 400);
        }

        $transaction->update([
            'returned_at' => Carbon::now(),
        ]);

        // Make book available again
        $transaction->book->update(['available' => true]);

        return response()->json([
            'message' => 'Book returned successfully',
            'transaction' => $transaction->load(['user', 'book'])
        ]);
    }

    public function index(Request $request)
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

        return Inertia::render('librarian/transactions/index', [
            'transactions' => $transactions,
            'filters' => $request->only(['status']),
        ]);
    }
}
