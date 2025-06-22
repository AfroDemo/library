<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Student;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\FacadesLog;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

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

            Log::info('Rendering dashboard with scan_step:', ['scan_step' => session('scan_step', 'student')]);

            return Inertia::render('librarian/dashboard', [
                'stats' => $stats,
                'student' => session('student', null),
                'book' => session('book', null),
                'scanStep' => session('scan_step', 'student'), // Changed to scan_step
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

        Log::info('Processing scan:', ['input' => $scanInput, 'step' => $scanStep, 'reset' => $reset]);

        if ($reset) {
            Log::info('Resetting scan state');
            return redirect()->route('dashboard')->with([
                'scan_step' => 'student',
                'student' => null,
                'book' => null,
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

            Log::info('Student found, setting scan_step to book:', ['student_id' => $studentId]);
            return redirect()->route('dashboard')->with([
                'student' => [
                    'student_id' => $student->member_id,
                    'name' => $student->user->name,
                    'email' => $student->user->email,
                ],
                'scan_step' => 'book',
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

        $studentModel = Student::where('member_id', $student['student_id'])->first();

        if (!$studentModel) {
            Log::error('Student not found in database:', ['student_id' => $student['student_id']]);
            return redirect()->route('dashboard')->withErrors(['scan_input' => 'Student not found']);
        }

        // Create transaction
        Transaction::create([
            'student_id' => $studentModel->id,
            'book_id' => $book->id,
            'borrowed_at' => now(),
            'due_date' => now()->addDays(14),
        ]);

        $book->update(['available' => false]);

        Log::info('Transaction created, resetting scan_step to student');
        return redirect()->route('dashboard')->with([
            'scan_step' => 'student',
            'student' => null,
            'book' => null,
            'success' => "Book \"{$book->title}\" borrowed successfully",
        ]);
    }

    protected function parseStudentId(string $input): string
    {
        $parts = explode('|', $input);
        return count($parts) === 3 ? $parts[1] : $input;
    }
}
