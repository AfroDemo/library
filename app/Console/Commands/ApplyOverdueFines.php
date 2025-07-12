<?php

namespace App\Console\Commands;

use App\Models\Fine;
use App\Models\Transaction;
use App\Notifications\OverdueFineNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class ApplyOverdueFines extends Command
{
    protected $signature = 'fines:apply-overdue';
    protected $description = 'Apply or update fines for overdue transactions';

    public function handle()
    {
        $this->info('Checking for overdue transactions to apply or update fines...');

        $overdueTransactions = Transaction::whereNull('returned_at')
            ->where('due_date', '<', Carbon::today())
            ->with(['fines', 'user'])
            ->get();

        $fineCount = 0;
        $updateCount = 0;

        foreach ($overdueTransactions as $transaction) {
            if (!$transaction->user_id || !$transaction->user) {
                Log::warning('Skipping transaction with missing user', [
                    'transaction_id' => $transaction->id,
                ]);
                continue;
            }

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
                    Notification::send($transaction->user, new OverdueFineNotification($transaction, $fineAmount));
                } elseif (!$existingFine) {
                    Fine::create([
                        'transaction_id' => $transaction->id,
                        'user_id' => $transaction->user_id,
                        'amount' => $fineAmount,
                        'paid' => false,
                    ]);
                    $fineCount++;
                    Log::info('Applied new fine for overdue transaction', [
                        'transaction_id' => $transaction->id,
                        'user_id' => $transaction->user_id,
                        'amount' => $fineAmount,
                    ]);
                    Notification::send($transaction->user, new OverdueFineNotification($transaction, $fineAmount));
                }
            }
        }

        $this->info("Applied $fineCount new fines and updated $updateCount existing fines for overdue transactions.");
    }
}
