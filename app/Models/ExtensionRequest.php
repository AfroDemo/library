<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExtensionRequest extends Model
{
    protected $fillable = [
        'transaction_id',
        'user_id',
        'requested_days',
        'status',
        'processed_at',
        'processed_by',
    ];

    protected $casts = [
        'requested_days' => 'integer',
        'status' => 'string',
        'processed_at' => 'datetime',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
