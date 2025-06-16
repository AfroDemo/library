<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::with('user');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('student_id', 'like', "%{$search}%");
            });
        }

        $students = $query->orderBy('name')->paginate(20);

        return Inertia::render('librarian/students/index', [
            'students' => $students,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('librarian/students/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|string|unique:students,student_id',
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        // Create user account
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'student',
        ]);

        // Create student record
        Student::create([
            'user_id' => $user->id,
            'student_id' => $request->student_id,
            'name' => $request->name,
            'email' => $request->email,
        ]);

        return redirect()->route('students.index')
            ->with('success', 'Student created successfully.');
    }

    public function show(Student $student)
    {
        $student->load(['user', 'user.transactions.book']);

        return Inertia::render('librarian/students/show', [
            'student' => $student,
        ]);
    }

    public function edit(Student $student)
    {
        $student->load('user');

        return Inertia::render('librarian/students/edit', [
            'student' => $student,
        ]);
    }

    public function update(Request $request, Student $student)
    {
        $request->validate([
            'student_id' => 'required|string|unique:students,student_id,' . $student->id,
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $student->user_id,
        ]);

        // Update user
        $student->user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        // Update student
        $student->update([
            'student_id' => $request->student_id,
            'name' => $request->name,
            'email' => $request->email,
        ]);

        return redirect()->route('students.index')
            ->with('success', 'Student updated successfully.');
    }

    public function destroy(Student $student)
    {
        // Check if student has active transactions
        if ($student->user->transactions()->whereNull('returned_at')->exists()) {
            return redirect()->route('students.index')
                ->with('error', 'Cannot delete student with active transactions.');
        }

        $student->user->delete(); // This will cascade delete the student record

        return redirect()->route('students.index')
            ->with('success', 'Student deleted successfully.');
    }
}
