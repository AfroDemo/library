<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shelf extends Model
{
    protected $fillable = [
        'floor',
        'shelf_number',
        'description',
    ];

    public function books(): HasMany
    {
        return $this->hasMany(Book::class);
    }
}
