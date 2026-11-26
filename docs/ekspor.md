# Pustaka ekspor: PDF dan Excel

Dua pustaka ditambahkan untuk ekspor laporan (PRD 6.4 dan Bagian 7):

| Pustaka | Versi | Untuk |
|---|---|---|
| `dompdf/dompdf` | 3.1.6 (+ 4 paket pendukung) | berkas PDF |
| `openspout/openspout` | 5.15.4 | berkas Excel (.xlsx) |

`composer.json` kini mensyaratkan **PHP ^8.4** (sebelumnya tertulis ^8.3, padahal 17 paket di `composer.lock` sudah butuh 8.4.1).
Pastikan PHP di komputer Anda 8.4 sebelum `composer install`.

## Aturan keamanan (wajib)

### Excel: isian pengguna harus dibungkus `StringCell`
OpenSpout memperlakukan teks berawalan `=` sebagai **rumus Excel aktif** bila sel dibuat lewat `Row::fromValues()`.
Judul tiket atau nama yang diawali `=HYPERLINK(...)` akan dijalankan Excel saat berkas dibuka (setara CSV injection).

```php
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Cell\StringCell;
use OpenSpout\Common\Entity\Row;

// BENAR: teks dari pengguna selalu StringCell
$baris = new Row([
    new StringCell($tiket->kode_tiket, null),
    new StringCell($tiket->judul, null),
    Cell::fromValue($tiket->jumlah_revisi),   // angka murni boleh
]);

// SALAH untuk isian pengguna:
// Row::fromValues([$tiket->kode_tiket, $tiket->judul]);
```

Dijaga oleh `tests/Unit/PustakaEksporTest.php` (sel rumus aktif harus 0).

### PDF: matikan pengambilan sumber daya luar dan PHP
```php
$opsi = new \Dompdf\Options();
$opsi->set('isRemoteEnabled', false); // tidak mengambil gambar atau CSS dari internet
$opsi->set('isPhpEnabled', false);    // tidak menjalankan PHP di dalam HTML
$opsi->set('defaultFont', 'DejaVu Sans'); // mendukung karakter Indonesia
```
Semua teks dari pengguna masuk HTML lewat `htmlspecialchars()` (atau `e()` di Blade).

### CSV
Tetap lewat `App\Services\EksporTiketCsv`, yang sudah menetralkan sel berawalan `=`, `+`, `-`, `@`.

## Pembatasan
Endpoint ekspor dibatasi lajunya (`throttle:20,1`) karena membaca banyak baris dan membuat berkas di memori.
Untuk Excel dan PDF, batasi jumlah baris atau tulis berkas langsung ke aliran (OpenSpout mendukung `openToBrowser`/`openToFile`)
agar laporan besar tidak menghabiskan memori.
