<?php

namespace App\Console\Commands;

use App\Models\Fine;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ApplyOverdueFines extends Command
{
    protected $signature = 'fines:apply-overdue';
    protected $description = 'Apply fines to overdue transactions that do not yet have a fine recorded';

    public function handle()
    {
        $overdueTransactions = Transaction::whereNull('returned_at')
            ->where('due_date', '<', Carbon::today())
            ->with('fines')
            ->get();

        $fineCount = 0;
        $updateCount = 0;

        foreach ($overdueTransactions as $transaction) {
            $existingFine = $transaction->fines()->latest()->first();
            $fineAmount = $transaction->calculateFine();
            if ($fineAmount > 0) {
                if ($existingFine && !$existingFine->paid) {
                    $existingFine->update(['amount' => $fineAmount]);
                    $updateCount++;
                    Log::info('Updated fine for overdue transaction', [
                        'transaction_id' => $transaction->id,
                        'user_id' => $transaction->user_id,
                        'amount' => $fineAmount,
                    ]);
                } elseif (!$existingFine) {
                    Fine::create([
                        'transaction_id' => $transaction->id,
                        'user_id' => $transaction->user_id,
                        'amount' => $fineAmount,
                        'paid' => false,
                    ]);
                    $fineCount++;
                    Log::info('Applied fine for overdue transaction', [
                        'transaction_id' => $transaction->id,
                        'user_id' => $transaction->user_id,
                        'amount' => $fineAmount,
                    ]);
                }
            }
        }

        $this->info("Applied $fineCount new fines and updated $updateCount existing fines for overdue transactions.");
    }
}
