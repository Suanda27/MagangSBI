<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $judul }}</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 8px; color: #1f2937; }
        h1 { font-size: 15px; margin: 0 0 4px 0; }
        .meta { font-size: 8px; color: #4b5563; margin-bottom: 10px; }
        .meta span { display: inline-block; margin-right: 14px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e3a8a; color: #ffffff; text-align: left; padding: 4px 5px; font-size: 8px; }
        td { border-bottom: 1px solid #e5e7eb; padding: 3px 5px; vertical-align: top; }
        tr:nth-child(even) td { background: #f9fafb; }
        .ringkasan { margin-bottom: 10px; }
        .ringkasan td { border: 1px solid #e5e7eb; padding: 4px 8px; font-size: 9px; }
        .ringkasan .nilai { font-weight: bold; font-size: 11px; }
        .kosong { text-align: center; padding: 14px; color: #6b7280; }
    </style>
</head>
<body>
    <h1>{{ $judul }}</h1>
    <div class="meta">
        @foreach ($keterangan as $label => $nilai)
            <span><strong>{{ $label }}:</strong> {{ $nilai }}</span>
        @endforeach
        <span><strong>Dibuat:</strong> {{ $dibuat }}</span>
    </div>

    @if (count($ringkasan) > 0)
        <table class="ringkasan">
            <tr>
                @foreach ($ringkasan as $label => $nilai)
                    <td>{{ $label }}<br><span class="nilai">{{ $nilai ?? '-' }}</span></td>
                @endforeach
            </tr>
        </table>
    @endif

    <table>
        <thead>
            <tr>
                @foreach ($kolom as $k)
                    <th>{{ $k }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($baris as $b)
                <tr>
                    @foreach ($b as $sel)
                        <td>{{ $sel }}</td>
                    @endforeach
                </tr>
            @empty
                <tr><td class="kosong" colspan="{{ count($kolom) }}">Tidak ada tiket pada filter ini.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
