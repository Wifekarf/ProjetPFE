<?php

namespace App\Controller;

use App\Entity\User;
use App\Enum\UserRole;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Doctrine\ORM\EntityManagerInterface;

#[Route('/api/admin', name: 'api_admin_')]
class AdminController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher
    ) {}

    // #[Route('/create-rh-manager', name: 'create_rh_manager', methods: ['POST'])]
    // public function createRHManager(Request $request): JsonResponse
    // {

    //     $data = json_decode($request->getContent(), true);

    //     $user = new User();
    //     $user->setEmail($data['email']);
    //     $user->setUsername($data['username']);
    //     $user->setRole(UserRole::ROLE_RH_MANAGER);
        
    //     // Hash the password
    //     $hashedPassword = $this->passwordHasher->hashPassword($user, $data['password']);
    //     $user->setPassword($hashedPassword);

    //     $this->em->persist($user);
    //     $this->em->flush();

    //     return $this->json([
    //         'message' => 'RH Manager created successfully',
    //         'user' => [
    //             'id' => $user->getId(),
    //             'email' => $user->getEmail(),
    //             'username' => $user->getUsername(),
    //             'role' => $user->getRole()->value
    //         ]
    //     ], 201);
    // }

    // #[Route('/grant-rh-role/{id}', name: 'grant_rh_role', methods: ['PUT'])]
    // public function grantRHManagerRole(int $id): JsonResponse
    // {

    //     $user = $this->em->getRepository(User::class)->find($id);
        
    //     if (!$user) {
    //         return $this->json(['error' => 'User not found'], 404);
    //     }

    //     $user->setRole(UserRole::ROLE_RH_MANAGER);
    //     $this->em->flush();

    //     return $this->json([
    //         'message' => 'RH Manager role granted successfully',
    //         'user' => [
    //             'id' => $user->getId(),
    //             'email' => $user->getEmail(),
    //             'username' => $user->getUsername(),
    //             'role' => $user->getRole()->value
    //         ]
    //     ]);
    // }

    #[Route('/revoke-rh-role/{id}', name: 'revoke_rh_role', methods: ['PUT'])]
    public function revokeRHManagerRole(int $id): JsonResponse
    {

        $user = $this->em->getRepository(User::class)->find($id);
        
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $user->setRole(UserRole::ROLE_USER);
        $this->em->flush();

        return $this->json([
            'message' => 'RH Manager role revoked successfully',
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'username' => $user->getUsername(),
                'role' => $user->getRole()->value
            ]
        ]);
    }
    // #[Route('/rh-managers', name: 'list_rh_managers', methods: ['GET'])]
    // public function listRHManagers(): JsonResponse
    // {

    //     $rhManagers = $this->em->getRepository(User::class)->findBy(['role' => UserRole::ROLE_RH_MANAGER]);

    //     $data = array_map(function($user) {
    //         return [
    //             'id' => $user->getId(),
    //             'email' => $user->getEmail(),
    //             'username' => $user->getUsername(),
    //             'role' => $user->getRole()->value,
    //             'dateCreation' => $user->getDateCreation()->format('Y-m-d H:i:s')
    //         ];
    //     }, $rhManagers);

    //     return $this->json([
    //         'rhManagers' => $data,
    //         'total' => count($data)
    //     ]);
    // }

    public function promoteUser(int $id): JsonResponse
    {
        $user = $this->em->getRepository(User::class)->find($id);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        // Update to promote to admin instead of RH manager
        $user->setRole(UserRole::ROLE_ADMIN);
        $this->em->flush();

        return $this->json(['message' => 'User promoted successfully']);
    }

    public function promoteToTeamManager(int $id): JsonResponse
    {
        $user = $this->em->getRepository(User::class)->find($id);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $user->setRole(UserRole::ROLE_TEAM_MANAGER);
        $this->em->flush();

        return $this->json(['message' => 'User promoted to team manager successfully']);
    }

    public function getManagers(): JsonResponse
    {
        // Update to only get admin users
        $admins = $this->em->getRepository(User::class)->findBy(['role' => UserRole::ROLE_ADMIN]);
        $data = [];

        foreach ($admins as $admin) {
            $data[] = [
                'id' => $admin->getId(),
                'username' => $admin->getUsername(),
                'email' => $admin->getEmail(),
                'role' => $admin->getRole(),
            ];
        }

        return $this->json($data);
    }
}