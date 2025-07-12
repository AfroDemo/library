<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'string', // Store as string, cast to int/float in controller as needed
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted()
    {
        static::saved(function () {
            Cache::forget('library_settings');
        });

        static::deleted(function () {
            Cache::forget('library_settings');
        });
    }

    /**
     * Get a setting value by key with a default fallback.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function getValue(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }
}
