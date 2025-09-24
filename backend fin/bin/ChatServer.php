#!/usr/bin/env php
<?php

use App\websocket\Chat;
use Ratchet\Http\HttpServer;
use Ratchet\Server\IoServer;
use Ratchet\WebSocket\WsServer;
use Symfony\Component\Dotenv\Dotenv;
use Symfony\Component\ErrorHandler\Debug;
use Symfony\Bundle\FrameworkBundle\Console\Application;

require dirname(__DIR__).'/vendor/autoload.php';

// Charger les variables d'environnement
if (file_exists(dirname(__DIR__).'/.env')) {
    (new Dotenv())->loadEnv(dirname(__DIR__).'/.env');
}

// Debug (si nécessaire)
if ($_SERVER['APP_DEBUG'] ?? false) {
    Debug::enable();
}

// Boot Symfony kernel
$kernel = new \App\Kernel($_SERVER['APP_ENV'] ?? 'dev', (bool) ($_SERVER['APP_DEBUG'] ?? true));
$kernel->boot();

// Récupérer l'EntityManager via le service container avec get()
$container = $kernel->getContainer();

// 💡 Astuce pour accéder à un service supprimé du container compilé :
$entityManager = $container->get('doctrine.orm.entity_manager');

// Créer le handler WebSocket avec l'EntityManager
$chat = new Chat($entityManager);

echo "[WS] ✅ WebSocket server started on port 8080...\n";

$server = IoServer::factory(
    new HttpServer(
        new WsServer($chat)
    ),
    8080
);

$server->run();
