<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($user->role == "admin") {
            return Inertia::render('admin/dashboard');
        } else if ($user->role == "librarian") {
            return Inertia::render('librarian/dashboard');
        } else if ($user->role == "student" || $user->role == "staff") {
            return Inertia::render('user/dashboard');
        }
    }
}
