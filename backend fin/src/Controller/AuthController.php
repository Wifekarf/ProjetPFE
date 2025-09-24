<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\UserQuiz;
use App\Enum\UserRole;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Encoder\JWTEncoderInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;

#[Route('/api')]
class AuthController extends AbstractController
{
    private EntityManagerInterface $em;
    private UserPasswordHasherInterface $passwordHasher;
    private JWTTokenManagerInterface $jwtManager;

    public function __construct(
        EntityManagerInterface $em,
        private JWTEncoderInterface $jwtEncoder,
        UserPasswordHasherInterface $passwordHasher,
        JWTTokenManagerInterface $jwtManager
    ) {
        $this->em = $em;
        $this->passwordHasher = $passwordHasher;
        $this->jwtManager = $jwtManager;
    }

   #[Route('/login', name: 'api_login', methods: ['POST'])]
public function login(Request $request): JsonResponse
{
   $data = json_decode($request->getContent(), true);
$email = $data['email'] ?? null;
$password = $data['password'] ?? null;

if (!$email || !$password) {
    return new JsonResponse(['error' => 'Email and password required'], 400);
}
$this->em->clear(); // Vider le cache d'entités
$user = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);


// 🔎 Debug absolu : tout afficher
dd([
    'user_email' => $user->getEmail(),
    'status_raw' => $user->getStatus(),
    'status_trimmed' => trim((string)$user->getStatus()),
    'status_lower' => strtolower(trim((string)$user->getStatus())),
    'is_inactive' => strtolower(trim((string)$user->getStatus())) === 'inactive',
]);


    if (!$user || !$this->passwordHasher->isPasswordValid($user, $password)) {
        return new JsonResponse(['error' => 'Invalid credentials'], 401);
    }

    // 🔒 BLOCAGE FONCTIONNEL
    if (strtolower(trim($user->getStatus())) === 'inactive') {
        return new JsonResponse(['error' => 'Your account has been deactivated.'], 403);
    }

    // ✅ login autorisé → on continue
    $userQuizzes = $this->em->getRepository(UserQuiz::class)->findBy(['user' => $user]);
    $points = array_reduce($userQuizzes, function ($carry, $userQuiz) {
        return $carry + $userQuiz->getScorePoints();
    }, 0);

    $token = $this->jwtManager->create($user);

    $response = new JsonResponse([
        'token' => $token,
        'id' => $user->getId(),
        'username' => $user->getUsername(),
        'email' => $user->getEmail(),
        'role' => $user->getRole(),
        'points_total_all' => $points,
        'date_creation' => $user->getDateCreation()->format('Y-m-d H:i:s'),
    ]);

    $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:5173');
    $response->headers->set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return $response;
}


    #[Route('/register', name: 'api_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $username = $data['username'] ?? null;
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!$username || !$email || !$password) {
            return $this->json(['error' => 'Champs requis manquants.'], 400);
        }

        $existingUser = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);
        if ($existingUser) {
            return $this->json(['error' => 'Un utilisateur avec cet email existe déjà.'], 400);
        }

        $user = new User();
        $user->setUsername($username);
        $user->setEmail($email);
        $user->setPassword($this->passwordHasher->hashPassword($user, $password));
        $user->setRole(UserRole::ROLE_USER);
        $user->setPointsTotalAll(0);
        $user->setDateCreation(new \DateTime());

        $this->em->persist($user);
        $this->em->flush();

        return $this->json([
            'id' => $user->getId(),
            'username' => $user->getUsername(),
            'email' => $user->getEmail(),
            'role' => $user->getRole(),
            'points_total_all' => $user->getPointsTotalAll(),
            'date_creation' => $user->getDateCreation()->format('Y-m-d H:i:s'),
        ], 201);
    }

    #[Route('/users/{id}', name: 'api_update_user', methods: ['PUT'])]
    public function updateUser(int $id, Request $request): JsonResponse
    {
        $user = $this->em->getRepository(User::class)->find($id);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $user->setPointsTotalAll($data['pointsTotalAll'] ?? $user->getPointsTotalAll());

        $this->em->flush();

        return $this->json(['id' => $user->getId()]);
    }
}
