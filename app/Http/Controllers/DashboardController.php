<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Student;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        Log::info('Session data on index:', session()->all());

        if ($user->role === 'admin') {
            return Inertia::render('admin/dashboard');
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
            return Inertia::render('user/dashboard');
        }

        return redirect()->route('login');
    }

    public function handleScan(Request $request)
    {
        $request->validate([
            'scan_input' => 'required|string',
            'scan_step' => 'required|in:student,book',
        ]);

        $scanInput = $request->input('scan_input');
        $scanStep = $request->input('scan_step');
        $reset = $request->boolean('reset', false);
        $clearAll = $request->boolean('clear_all', false);

        Log::info('Session data on handleScan:', session()->all());
        Log::info('Processing scan:', ['input' => $scanInput, 'step' => $scanStep, 'reset' => $reset, 'clear_all' => $clearAll]);

        if ($clearAll) {
            Log::info('Clearing all scan state');
            $request->session()->forget(['student', 'scan_step', 'book']);
            return redirect()->route('dashboard')->with([
                'scan_step' => 'student',
                'success' => 'All scan data cleared successfully',
            ]);
        }

        if ($reset) {
            Log::info('Resetting scan state');
            $request->session()->forget(['student', 'scan_step', 'book']);
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
                'student_id' => $student->member_id,
                'name' => $student->user->name,
                'email' => $student->user->email,
            ]);
            session()->put('scan_step', 'book');

            Log::info('Student found, setting scan_step to book:', ['student_id' => $studentId]);
            return redirect()->route('dashboard')->with([
                'success' => "Student {$student->user->name} loaded successfully",
            ]);
        }

        // Book scan
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

        // Store book details in session and move to confirm step
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

    protected function parseStudentId(string $input): string
    {
        $parts = explode('|', $input);
        return count($parts) === 3 ? $parts[1] : $input;
    }
}
