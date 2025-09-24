<?php

namespace App\Repository;

use App\Entity\Langages;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Langages>
 *
 * @method Langages|null find($id, $lockMode = null, $lockVersion = null)
 * @method Langages|null findOneBy(array $criteria, array $orderBy = null)
 * @method Langages[]    findAll()
 * @method Langages[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class LangagesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Langages::class);
    }

    // Add custom repository methods here if needed.
}
