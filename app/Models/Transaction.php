<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{
    protected $fillable = ['user_id', 'book_id', 'borrowed_at', 'due_date', 'returned_at'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function fines(): HasMany
    {
        return $this->hasMany(Fine::class);
    }

    public function extensionRequests(): HasMany
    {
        return $this->hasMany(ExtensionRequest::class);
    }

    public function calculateFine(): float
    {
        if ($this->returned_at || $this->due_date >= Carbon::today()) {
            return 0.0;
        }

        $daysOverdue = Carbon::today()->diffInDays($this->due_date);
        $finePerDay = Setting::where('key', 'fine_per_day')->first()->value ?? 2.0;
        return $daysOverdue * (float) $finePerDay;
    }
}
