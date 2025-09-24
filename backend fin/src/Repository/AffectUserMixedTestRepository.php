<?php

namespace App\Repository;

use App\Entity\AffectUserMixedTest;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AffectUserMixedTest>
 *
 * @method AffectUserMixedTest|null find($id, $lockMode = null, $lockVersion = null)
 * @method AffectUserMixedTest|null findOneBy(array $criteria, array $orderBy = null)
 * @method AffectUserMixedTest[]    findAll()
 * @method AffectUserMixedTest[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class AffectUserMixedTestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AffectUserMixedTest::class);
    }

    public function save(AffectUserMixedTest $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(AffectUserMixedTest $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Find mixed tests assigned to a specific user
     */
    public function findAssignedToUser(int $userId): array
    {
        return $this->createQueryBuilder('aumt')
            ->join('aumt.user', 'u')
            ->join('aumt.mixedTest', 'mt')
            ->where('u.id = :userId')
            ->setParameter('userId', $userId)
            ->orderBy('aumt.dateAffectation', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find users assigned to a specific mixed test
     */
    public function findUsersAssignedToMixedTest(int $mixedTestId): array
    {
        return $this->createQueryBuilder('aumt')
            ->join('aumt.mixedTest', 'mt')
            ->join('aumt.user', 'u')
            ->where('mt.id = :mixedTestId')
            ->setParameter('mixedTestId', $mixedTestId)
            ->orderBy('aumt.dateAffectation', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Check if a user is already assigned to a mixed test
     */
    public function isUserAssignedToMixedTest(int $userId, int $mixedTestId): bool
    {
        $result = $this->createQueryBuilder('aumt')
            ->select('COUNT(aumt.id)')
            ->join('aumt.user', 'u')
            ->join('aumt.mixedTest', 'mt')
            ->where('u.id = :userId')
            ->andWhere('mt.id = :mixedTestId')
            ->setParameter('userId', $userId)
            ->setParameter('mixedTestId', $mixedTestId)
            ->getQuery()
            ->getSingleScalarResult();

        return $result > 0;
    }
} 