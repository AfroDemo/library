<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\User;
use App\Models\Student;
use App\Models\Shelf;
use App\Models\Transaction;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function booksIndex(Request $request)
    {
        $query = Book::query()->with('shelf');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('author', 'like', "%{$search}%")
                    ->orWhere('isbn', 'like', "%{$search}%");
            });
        }

        if ($request->has('available')) {
            $query->where('available', $request->available === 'true');
        }

        $books = $query->orderBy('title')->paginate(20)->through(function ($book) {
            return [
                'id' => $book->id,
                'title' => $book->title,
                'author' => $book->author,
                'isbn' => $book->isbn,
                'available' => $book->available,
                'shelf' => $book->shelf ? [
                    'id' => $book->shelf->id,
                    'floor' => $book->shelf->floor,
                    'shelf_number' => $book->shelf->shelf_number,
                ] : null,
            ];
        });

        $shelves = Shelf::select('id', 'floor', 'shelf_number')->get();

        return Inertia::render('admin/books', [
            'books' => $books,
            'filters' => $request->only(['search', 'available']),
            'shelves' => $shelves->toArray(),
            'success' => session('success', null),
            'errors' => session('errors', []),
        ]);
    }

    public function booksStore(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'isbn' => 'required|string|size:10|unique:books,isbn',
            'shelf_id' => 'nullable|exists:shelves,id',
            'available' => 'boolean',
        ]);

        Book::create($validated);

        return redirect()->route('admin.books.index')->with('success', 'Book added successfully');
    }

    public function booksUpdate(Request $request, Book $book)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'isbn' => 'required|string|size:10|unique:books,isbn,' . $book->id,
            'shelf_id' => 'nullable|exists:shelves,id',
            'available' => 'boolean',
        ]);

        $book->update($validated);

        return redirect()->route('admin.books.index')->with('success', 'Book updated successfully');
    }

    public function booksDestroy(Book $book)
    {
        if ($book->transactions()->exists()) {
            return redirect()->route('admin.books.index')->withErrors(['book' => 'Cannot delete book with active transactions']);
        }

        $book->delete();

        return redirect()->route('admin.books.index')->with('success', 'Book deleted successfully');
    }

    public function usersIndex(Request $request)
    {
        $query = User::query();

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->paginate(20)->through(function ($user) {
            $student = $user->student;
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'member_id' => $student ? $student->member_id : null,
            ];
        });

        return Inertia::render('admin/users', [
            'users' => $users,
            'filters' => $request->only(['search', 'role']),
            'success' => session('success', null),
            'errors' => session('errors', []),
        ]);
    }

    public function usersStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|in:student,staff,librarian',
            'password' => 'required|string|min:8',
            'member_id' => 'required_if:role,student|unique:students,member_id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => bcrypt($validated['password']),
        ]);

        if ($validated['role'] === 'student') {
            Student::create([
                'user_id' => $user->id,
                'member_id' => $validated['member_id'],
            ]);
        }

        return redirect()->route('admin.users.index')->with('success', 'User added successfully');
    }

    public function usersUpdate(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role' => 'required|in:student,staff,librarian',
            'password' => 'nullable|string|min:8',
            'member_id' => 'required_if:role,student|unique:students,member_id,' . ($user->student ? $user->student->id : null),
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => $validated['password'] ? bcrypt($validated['password']) : $user->password,
        ]);

        if ($validated['role'] === 'student') {
            if ($user->student) {
                $user->student->update(['member_id' => $validated['member_id']]);
            } else {
                Student::create([
                    'user_id' => $user->id,
                    'member_id' => $validated['member_id'],
                ]);
            }
        } elseif ($user->student) {
            $user->student->delete();
        }

        return redirect()->route('admin.users.index')->with('success', 'User updated successfully');
    }

    public function usersDestroy(User $user)
    {
        if ($user->transactions()->exists()) {
            return redirect()->route('admin.users.index')->withErrors(['user' => 'Cannot delete user with active transactions']);
        }

        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully');
    }

    public function librariansIndex(Request $request)
    {
        $query = User::where('role', 'librarian');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $librarians = $query->paginate(20)->through(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ];
        });

        return Inertia::render('admin/librarians', [
            'librarians' => $librarians,
            'filters' => $request->only(['search']),
            'success' => session('success', null),
            'errors' => session('errors', []),
        ]);
    }

    public function librariansStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => 'librarian',
            'password' => bcrypt($validated['password']),
        ]);

        return redirect()->route('admin.librarians.index')->with('success', 'Librarian added successfully');
    }

    public function librariansUpdate(Request $request, User $user)
    {
        if ($user->role !== 'librarian') {
            return redirect()->route('admin.librarians.index')->withErrors(['user' => 'User is not a librarian']);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'] ? bcrypt($validated['password']) : $user->password,
        ]);

        return redirect()->route('admin.librarians.index')->with('success', 'Librarian updated successfully');
    }

    public function librariansDestroy(User $user)
    {
        if ($user->role !== 'librarian') {
            return redirect()->route('admin.librarians.index')->withErrors(['user' => 'User is not a librarian']);
        }

        if ($user->transactions()->exists()) {
            return redirect()->route('admin.librarians.index')->withErrors(['user' => 'Cannot delete librarian with active transactions']);
        }

        $user->delete();

        return redirect()->route('admin.librarians.index')->with('success', 'Librarian deleted successfully');
    }

    public function settingsIndex()
    {
        $settings = Cache::remember('library_settings', 300, function () {
            return [
                'loan_duration_days' => (int) Setting::getValue('loan_duration_days', 14),
                'max_books_per_user' => (int) Setting::getValue('max_books_per_user', 5),
                'overdue_fine_per_day' => (float) Setting::getValue('overdue_fine_per_day', 2.00),
            ];
        });

        return Inertia::render('admin/settings', [
            'settings' => $settings,
            'success' => session('success', null),
            'errors' => session('errors', []),
        ]);
    }

    public function settingsUpdate(Request $request)
    {
        $validated = $request->validate([
            'loan_duration_days' => 'required|integer|min:1',
            'max_books_per_user' => 'required|integer|min:1',
            'overdue_fine_per_day' => 'required|numeric|min:0',
        ]);

        Setting::updateOrCreate(
            ['key' => 'loan_duration_days'],
            ['value' => (string) $validated['loan_duration_days']]
        );
        Setting::updateOrCreate(
            ['key' => 'max_books_per_user'],
            ['value' => (string) $validated['max_books_per_user']]
        );
        Setting::updateOrCreate(
            ['key' => 'overdue_fine_per_day'],
            ['value' => number_format((float) $validated['overdue_fine_per_day'], 2, '.', '')]
        );

        Cache::forget('library_settings');

        return redirect()->route('admin.settings.index')->with('success', 'Settings updated successfully');
    }

    public function shelvesIndex(Request $request)
    {
        $query = Shelf::query();

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('floor', 'like', "%{$search}%")
                    ->orWhere('shelf_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $shelves = $query->orderBy('floor')->orderBy('shelf_number')->paginate(20)->through(function ($shelf) {
            return [
                'id' => $shelf->id,
                'floor' => $shelf->floor,
                'shelf_number' => $shelf->shelf_number,
                'description' => $shelf->description,
                'book_count' => $shelf->books()->count(),
            ];
        });

        return Inertia::render('admin/location', [
            'shelves' => $shelves,
            'filters' => $request->only(['search']),
            'success' => session('success', null),
            'errors' => session('errors', []),
        ]);
    }

    public function shelvesStore(Request $request)
    {
        $validated = $request->validate([
            'floor' => 'required|string|max:50',
            'shelf_number' => 'required|string|max:50',
            'description' => 'nullable|string|max:255',
        ]);

        Shelf::create($validated);

        return redirect()->route('admin.shelves.index')->with('success', 'Shelf added successfully');
    }

    public function shelvesUpdate(Request $request, Shelf $shelf)
    {
        $validated = $request->validate([
            'floor' => 'required|string|max:50',
            'shelf_number' => 'required|string|max:50',
            'description' => 'nullable|string|max:255',
        ]);

        $shelf->update($validated);

        return redirect()->route('admin.shelves.index')->with('success', 'Shelf updated successfully');
    }

    public function shelvesDestroy(Shelf $shelf)
    {
        $shelf->delete();

        return redirect()->route('admin.shelves.index')->with('success', 'Shelf deleted successfully');
    }
}
