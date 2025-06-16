<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookController extends Controller
{
    public function index(Request $request)
    {
        $query = Book::query();

        if ($request->has('search')) {
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

        $books = $query->orderBy('title')->paginate(20);

        return Inertia::render('librarian/books/index', [
            'books' => $books,
            'filters' => $request->only(['search', 'available']),
        ]);
    }

    public function create()
    {
        return Inertia::render('librarian/books/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'isbn' => 'required|string|unique:books,isbn',
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'available' => 'boolean',
        ]);

        Book::create($request->all());

        return redirect()->route('books.index')
            ->with('success', 'Book created successfully.');
    }

    public function show(Book $book)
    {
        $book->load(['transactions.user']);

        return Inertia::render('librarian/books/show', [
            'book' => $book,
        ]);
    }

    public function edit(Book $book)
    {
        return Inertia::render('librarian/books/edit', [
            'book' => $book,
        ]);
    }

    public function update(Request $request, Book $book)
    {
        $request->validate([
            'isbn' => 'required|string|unique:books,isbn,' . $book->id,
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'available' => 'boolean',
        ]);

        $book->update($request->all());

        return redirect()->route('books.index')
            ->with('success', 'Book updated successfully.');
    }

    public function destroy(Book $book)
    {
        // Check if book has active transactions
        if ($book->transactions()->whereNull('returned_at')->exists()) {
            return redirect()->route('books.index')
                ->with('error', 'Cannot delete book with active transactions.');
        }

        $book->delete();

        return redirect()->route('books.index')
            ->with('success', 'Book deleted successfully.');
    }
}
