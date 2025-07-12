<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Student;
use App\Models\Transaction;
use App\Models\Fine;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        Log::info('Session data on index:', session()->all());

        if (!$user) {
            return redirect()->route('login');
        }

        if ($user->role === 'admin') {
            $stats = Cache::remember('admin_dashboard_stats', 300, function () {
                $today = Carbon::today();

                return [
                    'totalBooks' => Book::count(),
                    'availableBooks' => Book::where('available', true)->count(),
                    'borrowedBooks' => Book::where('available', false)->count(),
                    'totalStudents' => Student::count(),
                    'totalLibrarians' => User::where('role', 'librarian')->count(),
                    'totalUsers' => User::count(),
                    'totalTransactions' => Transaction::count(),
                    'overdueBooks' => Transaction::whereNull('returned_at')
                        ->where('due_date', '<', $today)
                        ->count(),
                    'activeTransactions' => Transaction::whereNull('returned_at')->count(),
                    'recentTransactions' => Transaction::whereDate('borrowed_at', $today)->count(),
                ];
            });

            return Inertia::render('admin/dashboard', [
                'stats' => $stats,
                'success' => session('success', null),
                'errors' => session('errors', []),
            ]);
        } elseif ($user->role === 'librarian') {
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

            return Inertia::render('librarian/dashboard', [
                'stats' => $stats,
                'student' => session('student', null),
                'book' => session('book', null),
                'scanStep' => session('scan_step', 'student'),
                'errors' => session('errors', []),
                'success' => session('success', null),
            ]);
        } elseif ($user->role === 'student' || $user->role === 'staff') {
            $transactionsQuery = Transaction::where('user_id', $user->id);
            $myBorrowedBooks = $transactionsQuery->whereNull('returned_at')->count();
            $activeLoans = $myBorrowedBooks;
            $overdueBooks = Transaction::where('user_id', $user->id)
                ->whereNull('returned_at')
                ->where('due_date', '<', Carbon::today())
                ->count();
            $returnedBooks = Transaction::where('user_id', $user->id)
                ->whereNotNull('returned_at')
                ->count();
            $totalBorrowed = Transaction::where('user_id', $user->id)->count();

            $stats = [
                'myBorrowedBooks' => $totalBorrowed,
                'activeLoans' => $activeLoans,
                'overdueBooks' => $overdueBooks,
                'returnedBooks' => $returnedBooks,
            ];

            $transactions = Transaction::where('user_id', $user->id)
                ->with(['book', 'fines', 'extensionRequests'])
                ->orderByDesc('borrowed_at')
                ->get()
                ->map(function ($t) {
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

            return Inertia::render('user/dashboard', [
                'stats' => $stats,
                'transactions' => $transactions,
                'success' => session('success', null),
                'errors' => session('errors', []),
            ]);
        }

        return redirect()->route('login');
    }

    public function handleScan(Request $request)
    {
        $reset = $request->boolean('reset', false);
        $clearAll = $request->boolean('clear_all', false);

        if (!$reset && !$clearAll) {
            $request->validate([
                'scan_input' => 'required|string',
                'scan_step' => 'required|in:student,book',
            ]);
        }

        $scanInput = $request->input('scan_input');
        $scanStep = $request->input('scan_step', 'student');

        Log::info('Processing scan:', ['input' => $scanInput, 'step' => $scanStep, 'reset' => $reset, 'clear_all' => $clearAll]);

        if ($clearAll) {
            Log::info('Clearing all scan state');
            session()->forget(['student', 'scan_step', 'book']);
            return redirect()->route('dashboard')->with([
                'scan_step' => 'student',
                'success' => 'All scan data cleared successfully',
            ]);
        }

        if ($reset) {
            Log::info('Resetting scan state');
            $request->session()->forget(['student', 'book', 'scan_step']);
            return redirect()->route('dashboard')->with([
                'scan_step' => 'student',
                'success' => 'Scan reset successfully',
            ]);
        }

        if ($scanStep === 'student') {
            Log::info('Parsing QR code:', ['input' => $scanInput]);
            $studentId = $this->parseStudentId($scanInput);
            $student = Student::where('member_id', $studentId)->with('user')->first();

            if (!$student) {
                Log::error('Student not found:', ['student_id' => $studentId]);
                return redirect()->route('dashboard')->withErrors(['scan_input' => 'Student not found']);
            }

            session()->put('student', [
                'member_id' => $student->member_id,
                'name' => $student->user->name,
                'email' => $student->user->email,
            ]);
            session()->put('scan_step', 'book');

            Log::info('Student found, setting scan_step to book:', ['student_id' => $studentId]);
            return redirect()->route('dashboard')->with([
                'success' => "Student {$student->user->name} loaded successfully",
            ]);
        }

        if (strlen($scanInput) !== 10 && strlen($scanInput) !== 13) {
            Log::error('Invalid ISBN length:', ['isbn' => $scanInput]);
            return redirect()->route('dashboard')->withErrors(['scan_input' => 'Invalid ISBN format. ISBN must be 10 or 13 digits.']);
        }
        if (!preg_match('/^\d+$/', $scanInput)) {
            Log::error('Invalid ISBN characters:', ['isbn' => $scanInput]);
            return redirect()->route('dashboard')->withErrors(['scan_input' => 'Invalid ISBN format. ISBN must contain only digits.']);
        }

        $book = Book::where('isbn', $scanInput)->first();

        if (!$book) {
            Log::error('Book not found:', ['isbn' => $scanInput]);
            return redirect()->route('dashboard')->withErrors(['scan_input' => 'Book not found']);
        }

        if (!$book->available) {
            Log::error('Book not available:', ['isbn' => $scanInput]);
            return redirect()->route('dashboard')->withErrors(['scan_input' => 'Book is not available']);
        }

        $student = session('student');

        if (!$student) {
            Log::error('No student in session');
            return redirect()->route('dashboard')->withErrors(['scan_input' => 'Please scan student ID first']);
        }

        session()->put('book', [
            'isbn' => $book->isbn,
            'title' => $book->title,
            'author' => $book->author,
            'available' => $book->available,
        ]);
        session()->put('scan_step', 'confirm');

        Log::info('Book found, setting scan_step to confirm:', ['isbn' => $scanInput]);
        return redirect()->route('dashboard')->with([
            'success' => "Book \"{$book->title}\" loaded successfully, please confirm borrowing",
        ]);
    }

    public function checkClearance(Request $request)
    {
        $request->validate([
            'member_id' => 'required|string|exists:students,member_id',
        ]);

        $student = Student::where('member_id', $request->member_id)->with('user')->first();

        if (!$student) {
            Log::error('Student not found for clearance check:', ['member_id' => $request->member_id]);
            return redirect()->route('dashboard')->withErrors(['member_id' => 'Student not found']);
        }

        $activeLoans = Transaction::where('user_id', $student->user_id)
            ->whereNull('returned_at')
            ->count();

        $unpaidFines = Fine::where('user_id', $student->user_id)
            ->where('paid', false)
            ->sum('amount');

        $response = [
            'stats' => session('stats', []),
            'student' => session('student', null),
            'book' => session('book', null),
            'scanStep' => session('scan_step', 'student'),
            'success' => session('success', null),
            'errors' => session('errors', []),
        ];

        if ($activeLoans === 0 && $unpaidFines === 0) {
            Log::info('Clearance check passed:', ['member_id' => $request->member_id]);
            $response['clearance'] = [
                'isCleared' => true,
                'message' => 'Student is cleared. No active loans or unpaid fines.',
            ];
        } else {
            Log::info('Clearance check failed:', ['member_id' => $request->member_id, 'activeLoans' => $activeLoans, 'unpaidFines' => $unpaidFines]);
            $response['clearance'] = [
                'isCleared' => false,
                'message' => 'Student is not cleared due to outstanding issues.',
                'details' => [
                    'activeLoans' => $activeLoans,
                    'unpaidFines' => $unpaidFines,
                ],
            ];
        }

        return Inertia::render('librarian/dashboard', $response);
    }

    protected function parseStudentId(string $input): string
    {
        $parts = explode('|', $input);
        return count($parts) === 3 ? $parts[1] : $input;
    }
}
