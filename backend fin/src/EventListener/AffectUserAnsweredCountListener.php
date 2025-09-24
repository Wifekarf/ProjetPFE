<?php

namespace App\EventListener;

use App\Entity\AffectUser;
use App\Entity\AffectUserProg;
use App\Service\WebSocketSender;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Event\PreUpdateEventArgs;

#[AsEntityListener(event: 'preUpdate', entity: AffectUser::class)]
#[AsEntityListener(event: 'preUpdate', entity: AffectUserProg::class)]
class AffectUserAnsweredCountListener
{
    private WebSocketSender $webSocketSender;
    private $logger;

    public function __construct(WebSocketSender $webSocketSender, \Psr\Log\LoggerInterface $logger)
    {
        $this->webSocketSender = $webSocketSender;
        $this->logger = $logger;
    }

    public function preUpdate($entity, PreUpdateEventArgs $args): void
    {
        $this->logger->info('[Listener] preUpdate called for entity: ' . get_class($entity));
        
        // Vérifier si le champ answeredCount a changé
        if ($args->hasChangedField('answeredCount')) {
            // Récupérer la session concernée (adapter selon ta structure)
            $teamSession = method_exists($entity, 'getTeamSession') ? $entity->getTeamSession() : null;
            if ($teamSession) {
                $teamSessionId = $teamSession->getId();
                $data = [
                    'type' => 'update_score',
                    'data' => [
                        'teamSessionId' => $teamSessionId,
                        // Ajoute d'autres infos utiles si besoin
                    ],
                ];
                try {
                    $this->logger->info('[Listener] update_score WebSocket message sent for session ' . $teamSessionId);
                    $this->webSocketSender->send($data);
                } catch (\Exception $e) {
                    $this->logger->error('[WebSocket] update_score send failed: ' . $e->getMessage());
                    error_log('[WebSocket] update_score send failed: ' . $e->getMessage());
                }
                error_log('[WebSocket] update_score sent for session ' . $teamSessionId);
            }
        }
    }
}
