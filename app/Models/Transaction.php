<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Transaction extends Model
{
    protected $fillable = [
        'user_id',
        'book_id',
        'borrowed_at',
        'due_date',
        'returned_at',
    ];

    protected $casts = [
        'borrowed_at' => 'datetime',
        'due_date' => 'datetime',
        'returned_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function fines()
    {
        return $this->hasMany(Fine::class);
    }

    public function extensionRequests()
    {
        return $this->hasMany(ExtensionRequest::class);
    }

    public function calculateFine()
    {
        if ($this->returned_at || $this->due_date >= Carbon::today()) {
            return 0;
        }

        $overdueDays = Carbon::today()->diffInDays($this->due_date);
        $finePerDay = config('library.overdue_fine_per_day', 2.00);
        return $overdueDays * $finePerDay;
    }
}
