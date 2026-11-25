<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Throwable;

/** Tiket belum melewati batas tutup otomatis (atau belum pernah dikirim hasilnya). Dijawab dengan HTTP 409. */
class BelumJatuhTempo extends ConflictHttpException
{
    public function __construct(string $message = 'Tiket ini belum melewati batas tutup otomatis.', ?Throwable $previous = null)
    {
        parent::__construct($message, $previous);
    }
}
