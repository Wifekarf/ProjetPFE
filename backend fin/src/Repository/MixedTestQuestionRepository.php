<?php

namespace App\Repository;

use App\Entity\MixedTestQuestion;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MixedTestQuestion>
 *
 * @method MixedTestQuestion|null find($id, $lockMode = null, $lockVersion = null)
 * @method MixedTestQuestion|null findOneBy(array $criteria, array $orderBy = null)
 * @method MixedTestQuestion[]    findAll()
 * @method MixedTestQuestion[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class MixedTestQuestionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MixedTestQuestion::class);
    }

    public function save(MixedTestQuestion $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(MixedTestQuestion $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Find questions assigned to a specific mixed test
     */
    public function findQuestionsByMixedTest(int $mixedTestId): array
    {
        return $this->createQueryBuilder('mtq')
            ->join('mtq.mixedTest', 'mt')
            ->join('mtq.question', 'q')
            ->where('mt.id = :mixedTestId')
            ->setParameter('mixedTestId', $mixedTestId)
            ->orderBy('mtq.dateCreation', 'ASC')
            ->getQuery()
            ->getResult();
    }
} 