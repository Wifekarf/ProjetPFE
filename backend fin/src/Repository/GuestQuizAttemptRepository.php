<?php
// src/Repository/GuestQuizAttemptRepository.php
namespace App\Repository;

use App\Entity\GuestQuizAttempt;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<GuestQuizAttempt>
 *
 * @method GuestQuizAttempt|null find($id, $lockMode = null, $lockVersion = null)
 * @method GuestQuizAttempt|null findOneBy(array $criteria, array $orderBy = null)
 * @method GuestQuizAttempt[]    findAll()
 * @method GuestQuizAttempt[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class GuestQuizAttemptRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, GuestQuizAttempt::class);
    }

    // If you need any custom query methods, add them here.
}
