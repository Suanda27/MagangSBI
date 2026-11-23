<?php

namespace App\Exceptions;

use App\Enums\StatusPermintaan;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

/** Perpindahan status yang tidak diizinkan oleh alur tiket. Dijawab dengan HTTP 409. */
class TransisiTidakValid extends ConflictHttpException
{
    public static function dari(StatusPermintaan $dari, StatusPermintaan $ke): self
    {
        return new self(sprintf(
            'Tiket berstatus "%s" tidak dapat dipindahkan ke "%s".',
            $dari->label(),
            $ke->label(),
        ));
    }
}
