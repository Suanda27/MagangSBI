<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Throwable;

/**
 * Perubahan master data ditolak karena masih ada tiket berjalan yang bergantung padanya
 * (mis. menonaktifkan PIC yang masih memegang tiket). Dijawab dengan HTTP 409.
 */
class DataMasihDipakai extends ConflictHttpException
{
    public function __construct(string $message = 'Data ini masih dipakai oleh tiket yang sedang berjalan.', ?Throwable $previous = null)
    {
        parent::__construct($message, $previous);
    }
}
