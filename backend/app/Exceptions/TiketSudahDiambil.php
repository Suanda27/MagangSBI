<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Throwable;

/** Tiket sudah diterima/ditolak PIC lain (atau bukan lagi berstatus baru). Dijawab dengan HTTP 409. */
class TiketSudahDiambil extends ConflictHttpException
{
    public function __construct(string $message = 'Tiket ini sudah diambil atau diproses oleh PIC lain.', ?Throwable $previous = null)
    {
        parent::__construct($message, $previous);
    }
}
