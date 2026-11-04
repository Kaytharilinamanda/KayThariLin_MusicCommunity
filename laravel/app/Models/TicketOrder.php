<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketOrder extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['total' => 'float'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }
}
