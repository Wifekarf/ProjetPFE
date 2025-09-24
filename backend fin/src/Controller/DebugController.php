<?php
// src/Controller/DebugController.php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class DebugController extends AbstractController
{
    #[Route('/_debug/jwt_env', methods:['GET'])]
    public function jwtEnv(): JsonResponse
    {
        return $this->json([
            'secret' => getenv('JWT_SECRET_KEY'),
            'public' => getenv('JWT_PUBLIC_KEY'),
            'pass'   => getenv('JWT_PASSPHRASE'),
        ]);
    }
}
