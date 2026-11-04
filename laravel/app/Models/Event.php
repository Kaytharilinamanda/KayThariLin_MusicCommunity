<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'price' => 'float',
            'featured' => 'boolean',
            'lineup' => 'array',
        ];
    }

    public function organizer()
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function orders()
    {
        return $this->hasMany(TicketOrder::class);
    }
}
