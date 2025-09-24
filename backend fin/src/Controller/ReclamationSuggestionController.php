<?php

namespace App\Controller;

use App\Entity\ReclamationSuggestion;
use App\Repository\ReclamationSuggestionRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/reclamations-suggestions')]
class ReclamationSuggestionController extends AbstractController
{
    #[Route('/add', name: 'add_reclamation_suggestion', methods: ['POST'])]
    public function add(Request $request, EntityManagerInterface $em, UserRepository $userRepo): JsonResponse
    {
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        $rs = new ReclamationSuggestion();
        $rs->setTitle($data['title'] ?? '');
        $rs->setDescription($data['description'] ?? '');
        $rs->setStatus('Pending');
        $rs->setCreatedAt(new \DateTimeImmutable());
        $rs->setUpdatedAt(new \DateTimeImmutable());
        $rs->setCreatedBy($user);
        if (!empty($data['targetUsers']) && is_array($data['targetUsers'])) {
            foreach ($data['targetUsers'] as $userId) {
                $target = $userRepo->find($userId);
                if ($target) {
                    $rs->addTargetUser($target);
                }
            }
        }
        $em->persist($rs);
        $em->flush();

        return $this->json(['success' => true, 'id' => $rs->getId()]);
    }

    /**
     * Edit an existing suggestion or complaint (only if status is 'pending' and by creator)
     */
    #[Route('/{id}', name: 'edit_reclamation_suggestion', methods: ['PUT'])]
    public function edit(int $id, Request $request, ReclamationSuggestionRepository $repo, EntityManagerInterface $em, UserRepository $userRepo): JsonResponse
    {
        $user = $this->getUser();
        $rs = $repo->find($id);
        if (!$rs || $rs->getCreatedBy() !== $user) {
            return $this->json(['error' => 'Not found or forbidden'], Response::HTTP_FORBIDDEN);
        }
        if ($rs->getStatus() !== 'Pending') {
            return $this->json(['error' => 'Only pending suggestions/complaints can be edited'], Response::HTTP_BAD_REQUEST);
        }
        $data = json_decode($request->getContent(), true);
        if (isset($data['title'])) $rs->setTitle($data['title']);
        if (isset($data['description'])) $rs->setDescription($data['description']);
        if (array_key_exists('targetUsers', $data) && is_array($data['targetUsers'])) {
            // Reset all target users
            foreach ($rs->getTargetUsers() as $oldUser) {
                $rs->removeTargetUser($oldUser);
            }
            foreach ($data['targetUsers'] as $userId) {
                $target = $userRepo->find($userId);
                if ($target) {
                    $rs->addTargetUser($target);
                }
            }
        }
        $rs->setUpdatedAt(new \DateTimeImmutable());
        $em->flush();
        return $this->json(['success' => true, 'id' => $rs->getId()]);
    }

    #[Route('/{id}/cancel', name: 'cancel_reclamation_suggestion', methods: ['PATCH'])]
    public function cancel(int $id, ReclamationSuggestionRepository $repo, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        $rs = $repo->find($id);
        if (!$rs || $rs->getCreatedBy() !== $user) {
            return $this->json(['error' => 'Not found or forbidden'], Response::HTTP_FORBIDDEN);
        }
        if ($rs->getStatus() !== 'Pending') {
            return $this->json(['error' => 'Cannot cancel'], Response::HTTP_BAD_REQUEST);
        }
        $rs->setStatus('Cancelled');
        $rs->setUpdatedAt(new \DateTimeImmutable());
        $em->flush();
        return $this->json(['success' => true]);
    }

    #[Route('/mine', name: 'my_reclamations_suggestions', methods: ['GET'])]
    public function listMine(ReclamationSuggestionRepository $repo): JsonResponse
    {
        $user = $this->getUser();
        $list = $repo->findBy(['createdBy' => $user], ['createdAt' => 'DESC']);
        $result = [];
        foreach ($list as $rs) {
            $targetUsers = [];
            foreach ($rs->getTargetUsers() as $u) {
                $targetUsers[] = [
                    'id' => $u->getId(),
                    'username' => $u->getUsername()
                ];
            }
            $result[] = [
                'id' => $rs->getId(),
                'title' => $rs->getTitle(),
                'description' => $rs->getDescription(),
                'status' => $rs->getStatus(),
                'createdAt' => $rs->getCreatedAt()->format('Y-m-d H:i:s'),
                'updatedAt' => $rs->getUpdatedAt()->format('Y-m-d H:i:s'),
                'targetUsers' => $targetUsers,
                'adminComment' => $rs->getAdminComment(),
            ];
        }
        return $this->json($result);
    }

    #[Route('/admin/list', name: 'admin_list_reclamations_suggestions', methods: ['GET'])]
    public function adminList(Request $request, ReclamationSuggestionRepository $repo): JsonResponse
    {
        $qb = $repo->createQueryBuilder('r')
            ->orderBy('r.createdAt', 'DESC');
        $list = $qb->getQuery()->getResult();

        $result = [];
        foreach ($list as $rs) {
            $targetUsers = [];
            foreach ($rs->getTargetUsers() as $u) {
                $targetUsers[] = [
                    'id' => $u->getId(),
                    'username' => $u->getUsername()
                ];
            }
            $result[] = [
                'id' => $rs->getId(),
                'title' => $rs->getTitle(),
                'description' => $rs->getDescription(),
                'status' => $rs->getStatus(),
                'createdAt' => $rs->getCreatedAt()->format('Y-m-d H:i:s'),
                'updatedAt' => $rs->getUpdatedAt()->format('Y-m-d H:i:s'),
                'teamManager' => $rs->getCreatedBy() ? [
                    'id' => $rs->getCreatedBy()->getId(),
                    'username' => $rs->getCreatedBy()->getUsername(),
                ] : null,
                'targetUsers' => $targetUsers,
                'adminComment' => $rs->getAdminComment(),
            ];
        }
        return $this->json($result);
    }

    #[Route('/admin/{id}', name: 'admin_detail_reclamation_suggestion', methods: ['GET'])]
    public function adminDetail(int $id, ReclamationSuggestionRepository $repo): JsonResponse
    {
        $rs = $repo->find($id);
        if (!$rs) return $this->json(['error' => 'Not found'], 404);
        $targetUsers = [];
        foreach ($rs->getTargetUsers() as $u) {
            $targetUsers[] = [
                'id' => $u->getId(),
                'username' => $u->getUsername()
            ];
        }
        $data = [
            'id' => $rs->getId(),
            'title' => $rs->getTitle(),
            'description' => $rs->getDescription(),
            'status' => $rs->getStatus(),
            'createdAt' => $rs->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $rs->getUpdatedAt()->format('Y-m-d H:i:s'),
            'createdBy' => $rs->getCreatedBy() ? [
                'id' => $rs->getCreatedBy()->getId(),
                'username' => $rs->getCreatedBy()->getUsername(),
                'teamManager' => $rs->getCreatedBy()->getTeamManager() ? [
                    'id' => $rs->getCreatedBy()->getTeamManager()->getId(),
                    'username' => $rs->getCreatedBy()->getTeamManager()->getUsername()
                ] : null
            ] : null,
            'targetUsers' => $targetUsers,
            'adminComment' => $rs->getAdminComment(),
        ];
        return $this->json($data);
    }

    #[Route('/admin/{id}/approve', name: 'admin_approve_reclamation_suggestion', methods: ['PATCH'])]
    public function adminApprove(int $id, Request $request, ReclamationSuggestionRepository $repo, EntityManagerInterface $em): JsonResponse
    {
        $rs = $repo->find($id);
        if (!$rs) return $this->json(['error' => 'Not found'], 404);
        if ($rs->getStatus() !== 'Pending') return $this->json(['error' => 'Not pending'], 400);
        $data = json_decode($request->getContent(), true);
        // Le commentaire admin est optionnel
        $rs->setStatus('Approved');
        $rs->setAdminComment($data['adminComment'] ?? null);
        $rs->setValidationDate(new \DateTimeImmutable());
        $rs->setUpdatedAt(new \DateTimeImmutable());
        $em->flush();
        return $this->json(['success' => true]);
    }

    #[Route('/admin/{id}/reject', name: 'admin_reject_reclamation_suggestion', methods: ['PATCH'])]
    public function adminReject(int $id, Request $request, ReclamationSuggestionRepository $repo, EntityManagerInterface $em): JsonResponse
    {
        $rs = $repo->find($id);
        if (!$rs) return $this->json(['error' => 'Not found'], 404);
        if ($rs->getStatus() !== 'Pending') return $this->json(['error' => 'Not pending'], 400);
        $data = json_decode($request->getContent(), true);
        // Le commentaire admin est optionnel
        $rs->setStatus('Rejected');
        $rs->setAdminComment($data['adminComment'] ?? null);
        $rs->setValidationDate(new \DateTimeImmutable());
        $rs->setUpdatedAt(new \DateTimeImmutable());
        $em->flush();
        return $this->json(['success' => true]);
    }
}
