<?php
// src/Controller/UserController.php
namespace App\Controller;

use App\Entity\User;
use App\Entity\UserQuiz;
use App\Repository\UserQuizRepository;
use App\Repository\UserProgProblemRepository;
use App\Repository\UserRepository;
use App\Enum\UserRank;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Lcobucci\JWT\Parser;  // Using lcobucci/jwt to parse the token
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Validation\Constraint\SignedWith;
use Lcobucci\JWT\Validation\Constraint\ValidAt;
use Lcobucci\Clock\SystemClock;
use App\Service\GeminiService;


#[Route('/api/users', name: 'api_users_')]
class UserController extends AbstractController
{
    private $em;
    private $userRepository;
    private $userQuizRepository;
    private $geminiService;
    
    public function __construct(EntityManagerInterface $em, UserRepository $userRepository, UserQuizRepository $userQuizRepository, GeminiService $geminiService)
    {
        $this->em = $em;
        $this->userRepository = $userRepository;
        $this->userQuizRepository = $userQuizRepository;
        $this->geminiService = $geminiService;
    }

    // Lister tous les utilisateurs

    #[Route('/{id}/session-badges', name: 'user_session_badges', methods: ['GET'])]
    public function getSessionBadges($id, UserQuizRepository $userQuizRepo, UserProgProblemRepository $userProgRepo): JsonResponse
    {
        $quizBadges = $userQuizRepo->getUserTop3Badges($id);
        $progBadges = $userProgRepo->getUserTop3Badges($id);
        $allBadges = array_merge($quizBadges, $progBadges);
        return $this->json($allBadges);
    }
    #[Route('/users', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $users = $this->userRepository->findAll();
        $data = [];

        foreach ($users as $user) {
            $data[] = [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'username' => $user->getUsername(), 
                'role' => $user->getRole(), 
                'rank' => $user->getRank(),
                'status' => $user->getStatus(),
                'points_total_all' => $user->getPointsTotalAll(),  
                'date_creation' => $user->getDateCreation()->format('Y-m-d H:i:s'),  
            ];
        }

        return $this->json($data);
    }

    // Lister les utilisateurs sans équipe
    #[Route('/no-team', name: 'no_team', methods: ['GET'])]
    public function listUsersWithoutTeam(): JsonResponse
    {
        $users = $this->userRepository->findUsersWithoutTeam();
        $data = [];
        foreach ($users as $user) {
            $data[] = [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'username' => $user->getUsername(),
                'role' => $user->getRole(),
                'rank' => $user->getRank(),
                'status' => $user->getStatus(),
                'points_total_all' => $user->getPointsTotalAll(),
                'date_creation' => $user->getDateCreation()->format('Y-m-d H:i:s'),
            ];
        }
        return $this->json($data);
    }

    // Afficher un utilisateur par son ID
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'username' => $user->getUsername(),
            'role' => $user->getRole(),
            'rank' => $user->getRank(),
            'status' => $user->getStatus(),
            'points_total_all' => $user->getPointsTotalAll(),
            'date_creation' => $user->getDateCreation()->format('Y-m-d H:i:s'),
        ]);
    }

    // Créer un nouvel utilisateur
    #[Route('/create', name: 'create', methods: ['POST'])]
    public function create(Request $request, UserPasswordHasherInterface $passwordHasher): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $user = new User();
        $user->setEmail($data['email']);
        $user->setUsername($data['username']);  // Set username
        $user->setPassword($passwordHasher->hashPassword($user, $data['password']));
        $user->setRole($data['role'] ?? 'ROLE_USER');  // Handle role field as string
        $user->setRank(
            UserRank::from(
                $data['rank'] ?? UserRank::JUNIOR->value
            )
        );
        $user->setPointsTotalAll($data['points_total_all'] ?? 0);  // Use correct field name
        $user->setStatus($data['status'] ?? 'active');  // Use correct field name
        // date_creation is automatically handled by the constructor

        $this->em->persist($user);
        $this->em->flush();

        return $this->json([
            'id' => $user->getId(),
            'message' => 'User created successfully!',
            'status' => $user->getStatus(),
        ], 201);
    }

    // Supprimer un utilisateur
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $this->em->remove($user);
        $this->em->flush();

        return $this->json(['message' => 'User deleted successfully!']);
    }

    // Mettre à jour un utilisateur existant
    #[Route('/modif/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request, UserPasswordHasherInterface $passwordHasher): JsonResponse
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        // Mettre à jour les champs de l'utilisateur
        if (isset($data['email'])) {
            $user->setEmail($data['email']);
        }

        if (isset($data['username'])) {
            $user->setUsername($data['username']);  // Update username
        }

        if (isset($data['role'])) {
            $user->setRole($data['role']);  // Update role
        }

        if (isset($data['rank'])) {
            $user->setRank(
                UserRank::from($data['rank'])
            );
        }

        if (isset($data['status'])) {
            $user->setStatus($data['status']);
        }

        // if (!isset($data['password'])->empty()) {
        //     $user->setPassword($passwordHasher->hashPassword($user, $data['password']));
        // }

        $this->em->flush();

        return $this->json([
            'id' => $user->getId(),
            'message' => 'User updated successfully!',
            'status' => $user->getStatus(),
        ]);
    }

   #[Route('/getQuizHistoriqueByid/{id}', name: 'api_get_historique_by_id', methods: ['GET'])]
public function getHistoriqueUserById(int $id): JsonResponse
{
    $user = $this->userRepository->find($id);
    if (!$user) {
        return $this->json(['error' => 'Utilisateur non trouvé'], 404);
    }

    // Fetch everything for that user, no status filter
    $completedQuizzes = $this->userQuizRepository->findBy(['user' => $user]);

    $data = [];
    foreach ($completedQuizzes as $uq) {
        $data[] = [
            'id'            => $uq->getId(),
            'quiz_title'    => $uq->getQuiz()->getNom(),
            'score'         => $uq->getScorePoints(),
            'correctAnswers'=> $uq->getCorrectAnswers(),
            'completed_at'  => $uq->getDateCreation()->format('Y-m-d H:i:s'),
        ];
    }

    return $this->json($data);
}

    // #[Route('/getQuizHistoriqueByid/{id}', name: 'api_get_historique_by_id', methods: ['GET'])]
    // public function getHistoriqueUserById(int $id): JsonResponse
    // {
    //     $user = $this->userRepository->find($id);
    
    //     if (!$user) {
    //         return $this->json(['error' => 'Utilisateur non trouvé'], 404);
    //     }
    
    //     $completedQuizzes = $this->userQuizRepository->createQueryBuilder('uq')
    //         ->andWhere('uq.user = :user')
    //         ->andWhere('uq.status = :status')
    //         ->setParameter('user', $user)
    //         ->setParameter('status', 'completed')
    //         ->getQuery()
    //         ->getResult();
    
    //     $data = [];
    
    //     foreach ($completedQuizzes as $quiz) {
    //         $data[] = [
    //             'id' => $quiz->getId(),
    //             'quiz_title' => $quiz->getQuiz()->getNom(), // Assumes there's a relation to Quiz entity with a getTitle()
    //             'score' => $quiz->getScorePoints(), // Adjust fields as needed
    //             'completed_at' => $quiz->getDateCreation()?->format('Y-m-d H:i:s'),
    //         ];
    //     }
    
    //     return $this->json($data);
    // }
    
  #[Route('/getbyid/{id}', name: 'api_get_user_by_id', methods: ['GET'])]
    public function getUserById(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], 404);
        }

        // compute total points
        $userQuizzes = $this->userQuizRepository->findBy(['user' => $user]);
        $points = array_reduce($userQuizzes, fn($carry, $uq) => $carry + $uq->getScorePoints(), 0);

        return $this->json([
            'id'             => $user->getId(),
            'username'       => $user->getUsername(),
            'email'          => $user->getEmail(),
            'role'           => $user->getRoles(),
            'rank'           => $user->getRank(),
            'status'         => $user->getStatus(),
            'pointsTotalAll' => $points,
            'dateCreation'   => $user->getDateCreation()->format('Y-m-d H:i:s'),
            'image'          => $user->getImage(),
            'cv'             => $user->getCv(),
            'profileAttributes' => $user->getProfileAttributes(),
        ]);
    }

    #[Route('/upload', name: 'upload', methods: ['POST'])]
    public function upload(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $imageFile = $request->files->get('image');
        $cvFile    = $request->files->get('cv');

        if ($imageFile) {
            $imageName = uniqid() . '.' . $imageFile->guessExtension();
            $imageFile->move($this->getParameter('kernel.project_dir') . '/public/uploads', $imageName);
            $user->setImage('/uploads/' . $imageName);
        }

        if ($cvFile) {
            $cvName = uniqid() . '.' . $cvFile->guessExtension();
            $cvFile->move($this->getParameter('kernel.project_dir') . '/public/uploads', $cvName);
            $user->setCv('/uploads/' . $cvName);
        }


        $this->em->flush();

        return $this->json([
            'message' => 'Files uploaded successfully',
            'image'   => $user->getImage(),
            'cv'      => $user->getCv(),

        ]);
    }

    #[Route('/generate-profile', name: 'generate_profile', methods: ['POST'])]
    public function generateProfile(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        // Check if user has a CV uploaded
        if (!$user->getCv()) {
            return $this->json(['error' => 'No CV found. Please upload a CV first.'], 400);
        }

        try {
            // Get the full path to the CV file
            $cvPath = $this->getParameter('kernel.project_dir') . '/public' . $user->getCv();
            
            // Generate profile attributes using Gemini
            $profileAttributes = $this->geminiService->generateProfileFromCV($cvPath);
            
            // Save the generated attributes to the user
            $user->setProfileAttributes($profileAttributes);
            $this->em->flush();

            return $this->json([
                'message' => 'Profile attributes generated successfully',
                'attributes' => $profileAttributes
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Failed to generate profile: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/profile-attributes', name: 'get_profile_attributes', methods: ['GET'])]
    public function getProfileAttributes(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        return $this->json([
            'attributes' => $user->getProfileAttributes()
        ]);
    }
    
}
      