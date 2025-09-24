<?php

namespace App\Repository;

use App\Entity\AffectUserQuiz;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AffectUserQuiz>
 */
class AffectUserQuizRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AffectUserQuiz::class);
    }

//    /**
//     * @return AffectUserQuiz[] Returns an array of AffectUserQuiz objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('a')
//            ->andWhere('a.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('a.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?AffectUserQuiz
//    {
//        return $this->createQueryBuilder('a')
//            ->andWhere('a.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }

    /**
     * @param $session TeamSession entity or id
     * @param string $status
     * @return AffectUserQuiz[]
     */
    public function findBySessionQuizAndStatus($session, string $status): array
    {
        return $this->createQueryBuilder('auq')
            ->andWhere('auq.teamSession = :session')
            ->andWhere('auq.status = :status')
            ->setParameter('session', $session)
            ->setParameter('status', $status)
            ->getQuery()
            ->getResult();
    }
}
