<?php

namespace App\Repository;

use App\Entity\ReclamationSuggestion;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ReclamationSuggestion>
 *
 * @method ReclamationSuggestion|null find($id, $lockMode = null, $lockVersion = null)
 * @method ReclamationSuggestion|null findOneBy(array $criteria, array $orderBy = null)
 * @method ReclamationSuggestion[]    findAll()
 * @method ReclamationSuggestion[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ReclamationSuggestionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReclamationSuggestion::class);
    }

    // Add custom repository methods here if needed
}
