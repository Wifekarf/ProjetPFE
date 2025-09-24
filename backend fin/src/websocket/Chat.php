<?php
// src/WebSocket/Chat.php
namespace App\websocket;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\Conversation;
use App\Entity\Message;
use App\Entity\GroupMember;
use App\Entity\TeamSession;

class Chat implements MessageComponentInterface
{
    protected static $clients;
    protected $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        self::$clients = new \SplObjectStorage;
        $this->entityManager = $entityManager;
    }

    public function onOpen(ConnectionInterface $conn)
    {
        $queryString = $conn->httpRequest->getUri()->getQuery();
        parse_str($queryString, $queryParams);
        $userId = $queryParams['userId'] ?? 0;
        // Accept only teamId (can be single or comma-separated list)
        $teamIds = [];
        if (isset($queryParams['teamId'])) {
            $teamIds = array_filter(array_map('trim', explode(',', $queryParams['teamId'])));
        }
        // Attach the new connection with teamIds array
        self::$clients->attach($conn, ['userId' => $userId, 'teamIds' => $teamIds]);
        echo "New connection! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        $data = json_decode($msg, true);
        $type = $data['type'] ?? null;
        $userId = $data['data']['userId'] ?? null;
        $teamId = $data['data']['teamId'] ?? null;
        $username = $data['data']['username'] ?? null;
        $content = $data['data']['content'] ?? null;
        $createdAt = $data['data']['createdAt'] ?? (new \DateTime())->format('Y-m-d H:i:s');

        $msgPayload = [
            'id' => null,
            'user' => $userId,
            'username' => $username,
            'content' => $content,
            'createdAt' => $createdAt,
            'teamId' => $teamId
        ];
        // Team (group) chat message propagation with teamId
        if ($type === 'chat_message' && $teamId && $userId && $content) {
            // Propagate to all clients whose teamIds array contains the message's teamId (except sender)
            foreach (self::$clients as $client) {
                $info = self::$clients[$client];
                $clientTeamIds = $info['teamIds'] ?? [];
                // Retrocompatibilité: si c'est une string ou null, on convertit en array
                if (!is_array($clientTeamIds)) {
                    $clientTeamIds = $clientTeamIds ? [$clientTeamIds] : [];
                }
                echo "info " . $info['userId'] . " teams [" . implode(',', $clientTeamIds) . "]\n";
                echo "user $userId team $teamId\n";
                if (
                    isset($info['userId']) &&
                    $info['userId'] != $userId &&
                    in_array($teamId, $clientTeamIds)
                ) {
                    $client->send(json_encode([
                        'type' => 'chat_message',
                        'data' => $msgPayload
                    ]));
                }
            }
            echo "[WebSocket] Team message propagated to connected members (except sender) with teamId.\n";
            return;
        }

        // Handle update_score propagation
        if ($type === 'update_score' && !empty($data['data']['teamSessionId'])) {
            $teamSessionId = $data['data']['teamSessionId'];
            // Fetch the TeamSession entity and get the teamId
            $teamSession = $this->entityManager->getRepository(TeamSession::class)->find($teamSessionId);
            if ($teamSession) {
                $team = $teamSession->getTeam();
                $teamIdForSession = is_object($team) ? $team->getId() : $team;
                // Propagate to all clients whose teamIds array contains this teamId
                foreach (self::$clients as $client) {
                    $info = self::$clients[$client];
                    $clientTeamIds = $info['teamIds'] ?? [];
                    if (!is_array($clientTeamIds)) {
                        $clientTeamIds = $clientTeamIds ? [$clientTeamIds] : [];
                    }
                    if (in_array($teamIdForSession, $clientTeamIds)) {
                        $client->send(json_encode([
                            'type' => 'update_score',
                            'data' => $data['data']
                        ]));
                    }
                }
                echo "[WebSocket] update_score propagated to team $teamIdForSession for session $teamSessionId.\n";
                return;
            } else {
                echo "[WebSocket] TeamSession not found for id $teamSessionId.\n";
            }
        }

        // Fallback to legacy logic if not a chat_message or update_score
        echo "Message received: {$msg}\n";
    }

    
    public function onClose(ConnectionInterface $conn)
    {
        // The connection is closed, updat
        self::$clients->detach($conn);
        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }



}