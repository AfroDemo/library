<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'user_id', 'student_id', 'study_year',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
