<?php

namespace App\Notifications;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class OverdueFineNotification extends Notification
{
    use Queueable;

    protected $transaction;
    protected $fineAmount;

    public function __construct(Transaction $transaction, float $fineAmount)
    {
        $this->transaction = $transaction;
        $fineAmount = round($fineAmount, 2);
        $this->fineAmount = $fineAmount;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Overdue Book Fine Notification')
            ->line("Your borrowed book '{$this->transaction->book->title}' is overdue.")
            ->line("A fine of $ {$this->fineAmount} has been applied or updated.")
            ->line("Please return the book as soon as possible to avoid additional fines.")
            ->action('View Details', url('/user/dashboard'));
    }
}
