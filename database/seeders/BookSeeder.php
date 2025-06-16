<?php

namespace Database\Seeders;

use App\Models\Book;
use Illuminate\Database\Seeder;

class BookSeeder extends Seeder
{
    public function run(): void
    {
        $books = [
            [
                'isbn' => '9780134685991',
                'title' => 'Effective Java',
                'author' => 'Joshua Bloch',
                'available' => true,
            ],
            [
                'isbn' => '9780596009205',
                'title' => 'Head First Design Patterns',
                'author' => 'Eric Freeman',
                'available' => true,
            ],
            [
                'isbn' => '9780132350884',
                'title' => 'Clean Code',
                'author' => 'Robert C. Martin',
                'available' => false,
            ],
            [
                'isbn' => '9780201633610',
                'title' => 'Design Patterns',
                'author' => 'Gang of Four',
                'available' => true,
            ],
            [
                'isbn' => '9780321125217',
                'title' => 'Domain-Driven Design',
                'author' => 'Eric Evans',
                'available' => true,
            ],
            [
                'isbn' => '9780134494166',
                'title' => 'Clean Architecture',
                'author' => 'Robert C. Martin',
                'available' => false,
            ],
            [
                'isbn' => '9780596007126',
                'title' => 'The Art of Unix Programming',
                'author' => 'Eric S. Raymond',
                'available' => true,
            ],
            [
                'isbn' => '9780321146533',
                'title' => 'Test Driven Development',
                'author' => 'Kent Beck',
                'available' => true,
            ],
            [
                'isbn' => '9780201485677',
                'title' => 'Refactoring',
                'author' => 'Martin Fowler',
                'available' => true,
            ],
            [
                'isbn' => '9780135957059',
                'title' => 'The Pragmatic Programmer',
                'author' => 'David Thomas',
                'available' => false,
            ],
        ];

        foreach ($books as $book) {
            Book::create($book);
        }
    }
}
