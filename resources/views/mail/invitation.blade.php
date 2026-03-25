<x-mail::message>
# Pozvánka do PHC Nexus

{{ $invitedBy }} vás zve do PHC Nexus — interní produktivitní platformy Pears Health Care.

<x-mail::button :url="$acceptUrl">
Přijmout pozvánku
</x-mail::button>

Pozvánka je platná do **{{ $expiresAt }}**.

Po kliknutí budete přesměrováni na přihlášení přes firemní Google účet.

Díky,<br>
{{ config('app.name') }}
</x-mail::message>
