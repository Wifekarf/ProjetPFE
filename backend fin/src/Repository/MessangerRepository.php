<?php

namespace App\Repository;

use App\Entity\Messanger;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Messanger>
 *
 * @method Messanger|null find($id, $lockMode = null, $lockVersion = null)
 * @method Messanger|null findOneBy(array $criteria, array $orderBy = null)
 * @method Messanger[]    findAll()
 * @method Messanger[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class MessangerRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Messanger::class);
    }

    // Add custom query methods if needed
}
