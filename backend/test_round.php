<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Starting...\n";
$service = app(\App\Services\FlyballService::class);
echo "Got service.\n";
try {
    var_dump($service->nextRound(\App\Flyball\Model\RoundKind::TwoTeam));
} catch (\Throwable $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
echo "Done.\n";
