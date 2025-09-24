<?php
// src/Repository/QuizSessionRepository.php

namespace App\Repository;

use App\Entity\QuizSession;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<QuizSession>
 *
 * @method QuizSession|null find($id, $lockMode = null, $lockVersion = null)
 * @method QuizSession|null findOneBy(array $criteria, array $orderBy = null)
 * @method QuizSession[]    findAll()
 * @method QuizSession[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class QuizSessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, QuizSession::class);
    }

    public function add(QuizSession $session, bool $flush = true): void
    {
        $this->_em->persist($session);
        if ($flush) {
            $this->_em->flush();
        }
    }

    public function remove(QuizSession $session, bool $flush = true): void
    {
        $this->_em->remove($session);
        if ($flush) {
            $this->_em->flush();
        }
    }

    // Add any custom query methods below if needed

}
