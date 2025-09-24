<?php

namespace App\Service;

use WebSocket\Client;
use WebSocket\ConnectionException;

class WebSocketSender
{
    private string $websocketUrl;

    public function __construct(string $websocketUrl = 'ws://localhost:8080')
    {
        $this->websocketUrl = $websocketUrl;
    }

    public function send(array $payload): bool
    {
        try {
            $client = new Client($this->websocketUrl);
            $client->send(json_encode($payload));
            $client->close();
            return true;
        } catch (ConnectionException $e) {
            error_log("WebSocket Error: {$e->getMessage()}");
            return false;
        }
    }
}