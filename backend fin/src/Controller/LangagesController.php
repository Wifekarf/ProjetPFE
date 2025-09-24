<?php

namespace App\Controller;

use App\Entity\Langages;
use App\Repository\LangagesRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/langages', name: 'api_langages_')]
class LangagesController extends AbstractController
{
    private EntityManagerInterface $em;
    private LangagesRepository $langagesRepository;

    public function __construct(EntityManagerInterface $em, LangagesRepository $langagesRepository)
    {
        $this->em = $em;
        $this->langagesRepository = $langagesRepository;
    }

    // List all langages
    #[Route('/', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $langages = $this->langagesRepository->findAll();
        $data = [];

        foreach ($langages as $langage) {
            $data[] = [
                'id'          => $langage->getId(),
                'nom'         => $langage->getNom(),
                'description' => $langage->getDescription(),
                'icon'        => $langage->getIcon(),
                'color'       => $langage->getColor(),
            ];
        }

        return $this->json($data);
    }

    // Show a single langage by its ID
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $langage = $this->langagesRepository->find($id);

        if (!$langage) {
            return $this->json(['error' => 'Langage not found'], 404);
        }

        $data = [
            'id'          => $langage->getId(),
            'nom'         => $langage->getNom(),
            'description' => $langage->getDescription(),
            'icon'        => $langage->getIcon(),
            'color'       => $langage->getColor(),
        ];

        return $this->json($data);
    }

    // Create a new langage
    #[Route('/create', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data || !isset($data['nom'], $data['icon'], $data['color'])) {
            return $this->json(['error' => 'Missing required fields'], 400);
        }

        try {
            $langage = new Langages();
            $langage->setNom($data['nom']);
            $langage->setDescription($data['description'] ?? null);
            $langage->setIcon($data['icon']);
            $langage->setColor($data['color']);

            $this->em->persist($langage);
            $this->em->flush();

            // Return the new langage data
            return $this->json([
                'id'          => $langage->getId(),
                'nom'         => $langage->getNom(),
                'description' => $langage->getDescription(),
                'icon'        => $langage->getIcon(),
                'color'       => $langage->getColor(),
            ], 201);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    // Update an existing langage
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $langage = $this->langagesRepository->find($id);

        if (!$langage) {
            return $this->json(['error' => 'Langage not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['nom'])) {
            $langage->setNom($data['nom']);
        }
        if (array_key_exists('description', $data)) {
            $langage->setDescription($data['description']);
        }
        if (isset($data['icon'])) {
            $langage->setIcon($data['icon']);
        }
        if (isset($data['color'])) {
            $langage->setColor($data['color']);
        }

        $this->em->flush();

        // Return updated data
        return $this->json([
            'id'          => $langage->getId(),
            'nom'         => $langage->getNom(),
            'description' => $langage->getDescription(),
            'icon'        => $langage->getIcon(),
            'color'       => $langage->getColor(),
        ]);
    }

    // Delete a langage
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $langage = $this->langagesRepository->find($id);

        if (!$langage) {
            return $this->json(['error' => 'Langage not found'], 404);
        }

        $this->em->remove($langage);
        $this->em->flush();

        return $this->json(['message' => 'Langage deleted successfully!']);
    }
}
