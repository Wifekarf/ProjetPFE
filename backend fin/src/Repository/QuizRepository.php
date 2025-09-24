<?php

namespace App\Repository;

use App\Entity\Quiz;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Quiz>
 */
class QuizRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Quiz::class);
    }

    /**
     * Exemple : trouver les quiz par type (examen, test technique, etc.)
     */
    public function findByType(string $type): array
    {
        return $this->createQueryBuilder('q')
            ->andWhere('q.type = :type')
            ->setParameter('type', $type)
            ->orderBy('q.id', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Exemple : trouver les quiz créés avant une certaine date
     */
    public function findCreatedBefore(\DateTimeInterface $date): array
    {
        return $this->createQueryBuilder('q')
            ->andWhere('q.date_creation < :date')
            ->setParameter('date', $date)
            ->orderBy('q.date_creation', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Exemple : trouver un quiz par son ID et avec une certaine logique de date de création
     */
    public function findByIdAndDate(int $id, \DateTimeInterface $date): ?Quiz
    {
        return $this->createQueryBuilder('q')
            ->andWhere('q.id = :id')
            ->andWhere('q.date_creation > :date')
            ->setParameter('id', $id)
            ->setParameter('date', $date)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
