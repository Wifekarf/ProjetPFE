<?php
// src/EventSubscriber/JWTAuthenticationSuccessSubscriber.php
namespace App\EventSubscriber;

use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Security\Core\Security;
use App\Entity\User; 

class JWTAuthenticationSuccessSubscriber implements EventSubscriberInterface
{
    public function __construct(private Security $security) {}

    public static function getSubscribedEvents(): array
    {
        return [
            AuthenticationSuccessEvent::class => 'onAuthenticationSuccess',
        ];
    }

    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        // 1) on récupère l'utilisateur depuis le token de sécurité
        $user = $this->security->getUser();   // toujours dispo ici

        // 2) on complète la réponse
        $data = $event->getData();            // ["token" => "…"]

        if ($user instanceof User) {          // vérifie que l'utilisateur est une instance de App\Entity\User
            $data['id']       = $user->getId();
            $data['username'] = $user->getUsername();
            $data['role']     = $user->getRole()->value;
        }

        $event->setData($data);
    }
}
