<?php

namespace App\Repository;

use App\Entity\UserProgProblem;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<UserProgProblem>
 */
class UserProgProblemRepository extends ServiceEntityRepository
{
    /**
     * Get all programming sessions where the user is in the top 3 by score for each session
     */

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserProgProblem::class);
    }

    public function save(UserProgProblem $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(UserProgProblem $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Get detailed programming problem history for user analysis
     */
    public function getUserProgProblemAnalysisData(int $userId): array
    {
        $qb = $this->createQueryBuilder('upp')
            ->select([
                'upp.scorePoints',
                'upp.completedTasks',
                'upp.dateCreation'
            ])
            ->where('upp.user = :userId')
            ->setParameter('userId', $userId)
            ->orderBy('upp.dateCreation', 'DESC');

        return $qb->getQuery()->getResult();
    }

    /**
     * Get programming problem performance trends over time for analysis
     */
    public function getUserProgProblemPerformanceTrends(int $userId): array
    {
        $qb = $this->createQueryBuilder('upp')
            ->select([
                'upp.dateCreation',
                'upp.scorePoints'
            ])
            ->where('upp.user = :userId')
            ->setParameter('userId', $userId)
            ->orderBy('upp.dateCreation', 'ASC');

        return $qb->getQuery()->getResult();
    }

    /**
     * Get language performance for analysis
     */
    public function getUserLanguagePerformance(int $userId): array
    {
        $qb = $this->createQueryBuilder('upp')
            ->select([
                'l.nom as language_name',
                'AVG(upp.scorePoints) as avg_score',
                'COUNT(upp.id) as total_attempts'
            ])
            ->leftJoin('upp.progProblem', 'pp')
            ->leftJoin('pp.language', 'l')
            ->where('upp.user = :userId')
            ->setParameter('userId', $userId)
            ->groupBy('l.nom');

        $results = $qb->getQuery()->getResult();
        
        // Convert results to expected format
        $formatted = [];
        foreach ($results as $result) {
            $formatted[] = [
                'language_name' => $result['language_name'] ?? 'Unknown',
                'avg_score' => round((float)$result['avg_score'], 2),
                'total_attempts' => (int)$result['total_attempts']
            ];
        }

        return $formatted;
    }

    /**
     * Get difficulty performance for analysis
     */
    public function getUserDifficultyPerformance(int $userId): array
    {
        $qb = $this->createQueryBuilder('upp')
            ->select([
                'pp.difficulty as difficulty_level',
                'AVG(upp.scorePoints) as avg_score',
                'COUNT(upp.id) as total_attempts'
            ])
            ->leftJoin('upp.progProblem', 'pp')
            ->where('upp.user = :userId')
            ->setParameter('userId', $userId)
            ->groupBy('pp.difficulty');

        $results = $qb->getQuery()->getResult();
        
        // Convert results to expected format
        $formatted = [];
        foreach ($results as $result) {
            $formatted[] = [
                'difficulty_level' => $result['difficulty_level'] ?? 'Unknown',
                'avg_score' => round((float)$result['avg_score'], 2),
                'total_attempts' => (int)$result['total_attempts']
            ];
        }

        return $formatted;
    }

    /**
     * Get recent programming activity for analysis
     */
    public function getUserRecentProgProblemActivity(int $userId): array
    {
        $qb = $this->createQueryBuilder('upp')
            ->select([
                'upp.dateCreation',
                'upp.scorePoints',
                'upp.completedTasks'
            ])
            ->where('upp.user = :userId')
            ->orderBy('upp.dateCreation', 'DESC')
            ->setMaxResults(50);

        return $qb->getQuery()->getResult();
    }

    /**
     * Get code quality analysis data
     */
    public function getUserCodeQualityAnalysis(int $userId): array
    {
        $qb = $this->createQueryBuilder('upp')
            ->select([
                'upp.scorePoints',
                'upp.llmEvaluations'
            ])
            ->where('upp.user = :userId')
            ->setParameter('userId', $userId);

        return $qb->getQuery()->getResult();
    }

    public function getUserTop3Badges(int $userId): array
    {
        $qb = $this->createQueryBuilder('upp')
            ->select('upp', 'p')
            ->join('upp.progProblem', 'p')
            ->andWhere('upp.teamSession IS NOT NULL')
            ->orderBy('p.id', 'ASC')
            ->addOrderBy('upp.scorePoints', 'DESC');

        $results = $qb->getQuery()->getResult();
        $badges = [];
        $currentProg = null;
        $rank = 0;
        foreach ($results as $row) {
            $progProblem = $row->getProgProblem();
            $user = $row->getUser();
            if (!$progProblem || !$user) {
                continue; // skip if relation is missing
            }
            $progId = $progProblem->getId();
            if ($progId !== $currentProg) {
                $currentProg = $progId;
                $rank = 1;
            } else {
                $rank++;
            }
            if ($user->getId() == $userId && $rank <= 3 && $row->getScorePoints() > 0) {
                $badges[] = [
                    'session_id'   => $progId,
                    'team_session_id' => $row->getTeamSession()->getId(),
                    'session_name' => $progProblem->getNom(),
                    'session_type' => 'prog',
                    'position'     => $rank,
                    'date'         => $row->getDateCreation()->format('Y-m-d'),
                ];
            }
        }
        return $badges;
    }
} 