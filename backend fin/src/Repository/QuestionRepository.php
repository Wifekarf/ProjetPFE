<?php

namespace App\Repository;

use App\Entity\Langages;
use App\Entity\Question;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Question>
 *
 * @method Question|null find($id, $lockMode = null, $lockVersion = null)
 * @method Question|null findOneBy(array $criteria, array $orderBy = null)
 * @method Question[]    findAll()
 * @method Question[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class QuestionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Question::class);
    }

    /**
     * Trouver les questions par niveau de difficulté
     */
    public function findByDifficulty(string $difficulty): array
    {
        return $this->createQueryBuilder('q')
            ->andWhere('q.difficulty = :difficulty')
            ->setParameter('difficulty', $difficulty)
            ->orderBy('q.id', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouver les questions d’un langage spécifique
     */
    public function findByLanguage(Langages $language): array
    {
        return $this->createQueryBuilder('q')
            ->andWhere('q.language = :language')
            ->setParameter('language', $language)
            ->getQuery()
            ->getResult();
    }
}
