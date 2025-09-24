<?php

namespace App\Repository;

use App\Entity\QuizQuestion;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class QuizQuestionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, QuizQuestion::class);
    }

    // Add custom query methods here if necessary
    public function findByQuizId($quizId)
    {
        return $this->createQueryBuilder('qq')
            ->andWhere('qq.quiz = :quizId')
            ->setParameter('quizId', $quizId)
            ->getQuery()
            ->getResult();
    }
}
