<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fine extends Model
{
    protected $fillable = [
        'transaction_id',
        'user_id',
        'amount',
        'paid',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid' => 'boolean',
        'paid_at' => 'datetime',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
