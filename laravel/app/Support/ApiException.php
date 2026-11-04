<?php

namespace App\Support;

use RuntimeException;

class ApiException extends RuntimeException
{
    public function __construct(string $message, public int $status = 400)
    {
        parent::__construct($message);
    }
}
