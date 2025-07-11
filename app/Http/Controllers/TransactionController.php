<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Student;
use App\Models\Transaction;
use App\Models\Fine;
use App\Models\ExtensionRequest;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function getStudent(Request $request, $id)
    {
        $student = Student::where('member_id', $id)->with('user')->first();
        if (!$student) {
            return response()->json(['error' => 'Student not found'], 404);
        }
        return response()->json([
            'member_id' => $student->member_id,
            'name' => $student->user->name,
            'email' => $student->user->email,
        ]);
    }

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

    public function userTransactions(Request $request)
    {
        $user = $request->user();
        $query = Transaction::with(['book', 'fines', 'extensionRequests'])
            ->where('user_id', $user->id)
            ->orderBy('borrowed_at', 'desc');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('book', function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('isbn', 'like', "%{$search}%");
                });
            });
        }

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

        Log::info('User transactions queried', [
            'user_id' => $user->id,
            'search' => $request->search,
            'status' => $request->status,
        ]);

        $transactions = $query->paginate(20)->through(function ($t) {
            $fine = $t->fines()->latest()->first();
            $extensionRequest = $t->extensionRequests()->latest()->first();
            return [
                'id' => $t->id,
                'borrowed_at' => $t->borrowed_at->toDateTimeString(),
                'due_date' => $t->due_date->toDateTimeString(),
                'returned_at' => $t->returned_at?->toDateTimeString(),
                'book_title' => $t->book ? $t->book->title : 'Unknown Book',
                'book_isbn' => $t->book ? $t->book->isbn : 'N/A',
                'fine_amount' => $fine ? $fine->amount : $t->calculateFine(),
                'fine_paid' => $fine ? $fine->paid : false,
                'extension_status' => $extensionRequest ? $extensionRequest->status : null,
                'requested_days' => $extensionRequest ? $extensionRequest->requested_days : null,
                'extension_id' => $extensionRequest ? $extensionRequest->id : null,
            ];
        });

        return Inertia::render('user/history', [
            'transactions' => [
                'data' => $transactions->items(),
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'total' => $transactions->total(),
                'per_page' => $transactions->perPage(),
            ],
            'filters' => $request->only(['search', 'status']),
        ]);
    }

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

        $loanDuration = Setting::where('key', 'loan_duration_days')->first()->value ?? 14;
        Transaction::create([
            'user_id' => $studentModel->user_id,
            'book_id' => $bookModel->id,
            'borrowed_at' => now(),
            'due_date' => now()->addDays($loanDuration),
        ]);

        $bookModel->update(['available' => false]);

        session()->forget(['student', 'scan_step', 'book']);

        Log::info('Transaction created, resetting scan_step to student');
        return redirect()->route('dashboard')->with([
            'scan_step' => 'student',
            'success' => "Book \"{$bookModel->title}\" borrowed successfully",
        ]);
    }

    public function returnBook(Request $request, Transaction $transaction)
    {
        if ($transaction->returned_at) {
            return response()->json(['error' => 'Book already returned'], 400);
        }

        $transaction->update([
            'returned_at' => Carbon::now(),
        ]);

        $transaction->book->update(['available' => true]);

        $fine = $transaction->calculateFine();
        if ($fine > 0) {
            Fine::create([
                'transaction_id' => $transaction->id,
                'user_id' => $transaction->user_id,
                'amount' => $fine,
                'paid' => false,
            ]);
        }

        return response()->json([
            'message' => 'Book returned successfully',
            'transaction' => $transaction->load(['user', 'book', 'fines']),
        ]);
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Transaction::with(['user.student', 'book', 'fines', 'extensionRequests'])
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

        $transactions = $query->paginate(20)->through(function ($t) {
            $fine = $t->fines()->latest()->first();
            $extensionRequest = $t->extensionRequests()->latest()->first();
            return [
                'id' => $t->id,
                'borrowed_at' => $t->borrowed_at->toDateTimeString(),
                'due_date' => $t->due_date->toDateTimeString(),
                'returned_at' => $t->returned_at?->toDateTimeString(),
                'student_name' => $t->user ? $t->user->name : 'Unknown User',
                'member_id' => $t->user && $t->user->student ? $t->user->student->member_id : 'N/A',
                'book_title' => $t->book ? $t->book->title : 'Unknown Book',
                'book_isbn' => $t->book ? $t->book->isbn : 'N/A',
                'fine_amount' => $fine ? $fine->amount : $t->calculateFine(),
                'fine_paid' => $fine ? $fine->paid : false,
                'extension_status' => $extensionRequest ? $extensionRequest->status : null,
                'requested_days' => $extensionRequest ? $extensionRequest->requested_days : null,
                'extension_id' => $extensionRequest ? $extensionRequest->id : null,
            ];
        });

        $transactionData = [
            'data' => $transactions->items(),
            'current_page' => $transactions->currentPage(),
            'last_page' => $transactions->lastPage(),
            'total' => $transactions->total(),
            'per_page' => $transactions->perPage(),
        ];

        if ($user->role === 'librarian') {
            return Inertia::render('librarian/transactions', [
                'transactions' => $transactionData,
                'filters' => $request->only(['status']),
            ]);
        } elseif ($user->role === 'admin') {
            return Inertia::render('admin/transactions', [
                'transactions' => $transactionData,
                'filters' => $request->only(['status']),
            ]);
        }
    }

    public function returnsPage(Request $request)
    {
        $activeTransactions = Transaction::with(['user.student', 'book', 'fines', 'extensionRequests'])
            ->whereNull('returned_at')
            ->orderBy('borrowed_at', 'desc')
            ->get()
            ->map(function ($t) {
                $fine = $t->fines()->latest()->first();
                $extensionRequest = $t->extensionRequests()->latest()->first();
                return [
                    'id' => $t->id,
                    'borrowed_at' => $t->borrowed_at->toDateTimeString(),
                    'due_date' => $t->due_date->toDateTimeString(),
                    'returned_at' => $t->returned_at?->toDateTimeString(),
                    'student_name' => $t->user ? $t->user->name : 'Unknown User',
                    'member_id' => $t->user && $t->user->student ? $t->user->student->member_id : 'N/A',
                    'book_title' => $t->book ? $t->book->title : 'Unknown Book',
                    'book_isbn' => $t->book ? $t->book->isbn : 'N/A',
                    'fine_amount' => $fine ? $fine->amount : $t->calculateFine(),
                    'fine_paid' => $fine ? $fine->paid : false,
                    'extension_status' => $extensionRequest ? $extensionRequest->status : null,
                    'requested_days' => $extensionRequest ? $extensionRequest->requested_days : null,
                    'extension_id' => $extensionRequest ? $extensionRequest->id : null,
                ];
            });
        return Inertia::render('librarian/returns', [
            'activeTransactions' => $activeTransactions,
        ]);
    }

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
        $fine = $transaction->calculateFine();
        if ($fine > 0) {
            Fine::create([
                'transaction_id' => $transaction->id,
                'user_id' => $transaction->user_id,
                'amount' => $fine,
                'paid' => false,
            ]);
        }
        return redirect()->route('librarian.returns')->with('success', 'Book returned successfully!');
    }

    public function overduePage(Request $request)
    {
        $overdueTransactions = Transaction::with(['user.student', 'book', 'fines', 'extensionRequests'])
            ->whereNull('returned_at')
            ->where('due_date', '<', Carbon::today())
            ->orderBy('due_date', 'asc')
            ->get()
            ->map(function ($t) {
                $fine = $t->fines()->latest()->first();
                $extensionRequest = $t->extensionRequests()->latest()->first();
                return [
                    'id' => $t->id,
                    'borrowed_at' => $t->borrowed_at->toDateTimeString(),
                    'due_date' => $t->due_date->toDateTimeString(),
                    'returned_at' => $t->returned_at?->toDateTimeString(),
                    'student_name' => $t->user ? $t->user->name : 'Unknown User',
                    'member_id' => $t->user && $t->user->student ? $t->user->student->member_id : 'N/A',
                    'student_email' => $t->user ? $t->user->email : 'N/A',
                    'student_phone' => $t->user && $t->user->student ? ($t->user->student->phone ?? 'N/A') : 'N/A',
                    'book_title' => $t->book ? $t->book->title : 'Unknown Book',
                    'book_isbn' => $t->book ? $t->book->isbn : 'N/A',
                    'fine_amount' => $fine ? $fine->amount : $t->calculateFine(),
                    'fine_paid' => $fine ? $fine->paid : false,
                    'extension_status' => $extensionRequest ? $extensionRequest->status : null,
                    'requested_days' => $extensionRequest ? $extensionRequest->requested_days : null,
                    'extension_id' => $extensionRequest ? $extensionRequest->id : null,
                ];
            });
        return Inertia::render('librarian/overdue', [
            'overdueTransactions' => $overdueTransactions,
        ]);
    }

    public function sendOverdueReminders(Request $request)
    {
        $request->validate([
            'transaction_ids' => 'required|array',
            'transaction_ids.*' => 'integer|exists:transactions,id',
        ]);
        $transactions = Transaction::with(['user', 'book', 'fines'])->whereIn('id', $request->transaction_ids)->get();
        foreach ($transactions as $t) {
            $fine = $t->fines()->latest()->first();
            $amount = $fine ? $fine->amount : $t->calculateFine();
            if ($amount > 0 && !$fine) {
                Fine::create([
                    'transaction_id' => $t->id,
                    'user_id' => $t->user_id,
                    'amount' => $amount,
                    'paid' => false,
                ]);
            }
            Log::info('Reminder sent for overdue transaction', [
                'transaction_id' => $t->id,
                'student_email' => $t->user ? $t->user->email : 'N/A',
                'student_phone' => $t->user && $t->user->student ? ($t->user->student->phone ?? 'N/A') : 'N/A',
                'book_title' => $t->book ? $t->book->title : 'Unknown Book',
                'fine_amount' => $amount,
            ]);
        }
        return redirect()->route('librarian.overdue')->with('success', 'Reminders sent!');
    }

    public function requestExtension(Request $request)
    {
        $request->validate([
            'transaction_id' => 'required|integer|exists:transactions,id',
            'requested_days' => 'required|integer|min:1|max:14',
        ]);

        $transaction = Transaction::findOrFail($request->transaction_id);
        if ($transaction->returned_at) {
            return response()->json(['error' => 'Cannot request extension for returned book'], 400);
        }

        if ($transaction->extensionRequests()->where('status', 'pending')->exists()) {
            return response()->json(['error' => 'An extension request is already pending'], 400);
        }

        ExtensionRequest::create([
            'transaction_id' => $transaction->id,
            'user_id' => $request->user()->id,
            'requested_days' => $request->requested_days,
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Extension request submitted successfully']);
    }

    public function processExtensionRequest(Request $request, ExtensionRequest $extensionRequest)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        if ($extensionRequest->status !== 'pending') {
            return redirect()->back()->withErrors(['extension_request' => 'Request already processed']);
        }

        $extensionRequest->update([
            'status' => $request->status,
            'processed_at' => Carbon::now(),
            'processed_by' => $request->user()->id,
        ]);

        if ($request->status === 'approved') {
            $transaction = $extensionRequest->transaction;
            $transaction->update([
                'due_date' => $transaction->due_date->addDays($extensionRequest->requested_days),
            ]);
        }

        return redirect()->route('librarian.overdue')->with('success', 'Extension request processed successfully');
    }
}
