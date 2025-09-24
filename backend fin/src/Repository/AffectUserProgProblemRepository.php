<?php

namespace App\Repository;

use App\Entity\AffectUserProgProblem;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AffectUserProgProblem>
 */
class AffectUserProgProblemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AffectUserProgProblem::class);
    }

    public function save(AffectUserProgProblem $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(AffectUserProgProblem $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @param $session TeamSession entity or id
     * @param string $status
     * @return AffectUserProgProblem[]
     */
    public function findBySessionProgProblemAndStatus($session, string $status): array
    {
        return $this->createQueryBuilder('aupp')
            ->andWhere('aupp.teamSession = :session')
            ->andWhere('aupp.status = :status')
            ->setParameter('session', $session)
            ->setParameter('status', $status)
            ->getQuery()
            ->getResult();
    }
}