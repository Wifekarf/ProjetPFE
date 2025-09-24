<?php

namespace App\Repository;

use App\Entity\MixedTest;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MixedTest>
 *
 * @method MixedTest|null find($id, $lockMode = null, $lockVersion = null)
 * @method MixedTest|null findOneBy(array $criteria, array $orderBy = null)
 * @method MixedTest[]    findAll()
 * @method MixedTest[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class MixedTestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MixedTest::class);
    }

    public function save(MixedTest $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(MixedTest $entity, bool $flush = false): void
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
        return $this->createQueryBuilder('mt')
            ->leftJoin('mt.questions', 'mtq')
            ->leftJoin('mt.tasks', 'mtt')
            ->leftJoin('mt.userAssignments', 'aumt')
            ->leftJoin('aumt.user', 'u')
            ->where('u.id = :userId')
            ->setParameter('userId', $userId)
            ->orderBy('aumt.dateAffectation', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find mixed tests with their question and task counts
     */
    public function findWithCounts(): array
    {
        return $this->createQueryBuilder('mt')
            ->select('mt, COUNT(DISTINCT mtq.id) as questionCount, COUNT(DISTINCT mtt.id) as taskCount')
            ->leftJoin('mt.questions', 'mtq')
            ->leftJoin('mt.tasks', 'mtt')
            ->groupBy('mt.id')
            ->getQuery()
            ->getResult();
    }
} 