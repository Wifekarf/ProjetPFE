<?php

namespace App\Repository;

use App\Entity\MixedTestTask;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MixedTestTask>
 *
 * @method MixedTestTask|null find($id, $lockMode = null, $lockVersion = null)
 * @method MixedTestTask|null findOneBy(array $criteria, array $orderBy = null)
 * @method MixedTestTask[]    findAll()
 * @method MixedTestTask[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class MixedTestTaskRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MixedTestTask::class);
    }

    public function save(MixedTestTask $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(MixedTestTask $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Find tasks assigned to a specific mixed test
     */
    public function findTasksByMixedTest(int $mixedTestId): array
    {
        return $this->createQueryBuilder('mtt')
            ->join('mtt.mixedTest', 'mt')
            ->join('mtt.task', 't')
            ->where('mt.id = :mixedTestId')
            ->setParameter('mixedTestId', $mixedTestId)
            ->orderBy('mtt.dateCreation', 'ASC')
            ->getQuery()
            ->getResult();
    }
} 