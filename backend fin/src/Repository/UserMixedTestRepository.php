<?php

namespace App\Repository;

use App\Entity\UserMixedTest;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<UserMixedTest>
 *
 * @method UserMixedTest|null find($id, $lockMode = null, $lockVersion = null)
 * @method UserMixedTest|null findOneBy(array $criteria, array $orderBy = null)
 * @method UserMixedTest[]    findAll()
 * @method UserMixedTest[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class UserMixedTestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserMixedTest::class);
    }

    public function save(UserMixedTest $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(UserMixedTest $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Find all submissions for a specific user
     */
    public function findByUser($user): array
    {
        return $this->createQueryBuilder('umt')
            ->andWhere('umt.user = :user')
            ->setParameter('user', $user)
            ->orderBy('umt.dateCreation', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find all submissions for a specific mixed test
     */
    public function findByMixedTest($mixedTest): array
    {
        return $this->createQueryBuilder('umt')
            ->andWhere('umt.mixedTest = :mixedTest')
            ->setParameter('mixedTest', $mixedTest)
            ->orderBy('umt.dateCreation', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find the best submission for a user on a specific mixed test
     */
    public function findBestSubmissionByUserAndTest($user, $mixedTest): ?UserMixedTest
    {
        return $this->createQueryBuilder('umt')
            ->andWhere('umt.user = :user')
            ->andWhere('umt.mixedTest = :mixedTest')
            ->setParameter('user', $user)
            ->setParameter('mixedTest', $mixedTest)
            ->orderBy('umt.scorePoints', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Get statistics for a specific mixed test
     */
    public function getTestStatistics($mixedTest): array
    {
        $qb = $this->createQueryBuilder('umt')
            ->select('COUNT(umt.id) as totalSubmissions')
            ->addSelect('AVG(umt.scorePoints) as averageScore')
            ->addSelect('MAX(umt.scorePoints) as highestScore')
            ->addSelect('MIN(umt.scorePoints) as lowestScore')
            ->addSelect('COUNT(CASE WHEN umt.passed = true THEN 1 END) as passedCount')
            ->andWhere('umt.mixedTest = :mixedTest')
            ->setParameter('mixedTest', $mixedTest);

        $result = $qb->getQuery()->getSingleResult();

        return [
            'totalSubmissions' => (int) $result['totalSubmissions'],
            'averageScore' => round((float) $result['averageScore'], 2),
            'highestScore' => (int) $result['highestScore'],
            'lowestScore' => (int) $result['lowestScore'],
            'passedCount' => (int) $result['passedCount'],
            'passRate' => $result['totalSubmissions'] > 0 ? round(($result['passedCount'] / $result['totalSubmissions']) * 100, 2) : 0
        ];
    }

    /**
     * Get user statistics for mixed tests
     */
    public function getUserStatistics($user): array
    {
        $qb = $this->createQueryBuilder('umt')
            ->select('COUNT(umt.id) as totalSubmissions')
            ->addSelect('AVG(umt.scorePoints) as averageScore')
            ->addSelect('SUM(umt.scorePoints) as totalScore')
            ->addSelect('COUNT(CASE WHEN umt.passed = true THEN 1 END) as passedCount')
            ->andWhere('umt.user = :user')
            ->setParameter('user', $user);

        $result = $qb->getQuery()->getSingleResult();

        return [
            'totalSubmissions' => (int) $result['totalSubmissions'],
            'averageScore' => round((float) $result['averageScore'], 2),
            'totalScore' => (int) $result['totalScore'],
            'passedCount' => (int) $result['passedCount'],
            'passRate' => $result['totalSubmissions'] > 0 ? round(($result['passedCount'] / $result['totalSubmissions']) * 100, 2) : 0
        ];
    }
} 