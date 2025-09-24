<?php
// src/Repository/QuizAuditRepository.php

namespace App\Repository;

use App\Entity\QuizAudit;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<QuizAudit>
 *
 * @method QuizAudit|null find($id, $lockMode = null, $lockVersion = null)
 * @method QuizAudit|null findOneBy(array $criteria, array $orderBy = null)
 * @method QuizAudit[]    findAll()
 * @method QuizAudit[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class QuizAuditRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, QuizAudit::class);
    }

    public function add(QuizAudit $audit, bool $flush = true): void
    {
        $this->_em->persist($audit);
        if ($flush) {
            $this->_em->flush();
        }
    }

    public function remove(QuizAudit $audit, bool $flush = true): void
    {
        $this->_em->remove($audit);
        if ($flush) {
            $this->_em->flush();
        }
    }

    // Add any custom query methods below if needed
}
