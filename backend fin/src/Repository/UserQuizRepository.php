<?php

namespace App\Repository;

use App\Entity\UserQuiz;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<UserQuiz>
 */
class UserQuizRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserQuiz::class);
    }

    // Example: Find all quizzes by a specific user
    public function findByUser($user): array
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();
    }

    /**
     * Get all quizzes where the user is in the top 3 by score for each quiz session
     */
    public function getUserTop3Badges(int $userId): array
    {
        $qb = $this->createQueryBuilder('uq')
            ->select('uq', 'q')
            ->join('uq.quiz', 'q')
            ->andWhere('uq.teamSession IS NOT NULL')
            ->orderBy('q.id', 'ASC')
            ->addOrderBy('uq.scorePoints', 'DESC');

        $results = $qb->getQuery()->getResult();
        $badges = [];
        $currentQuiz = null;
        $rank = 0;
        foreach ($results as $row) {
            $quizId = $row->getQuiz()->getId();
            if ($quizId !== $currentQuiz) {
                $currentQuiz = $quizId;
                $rank = 1;
            } else {
                $rank++;
            }
            if ($row->getUser()->getId() == $userId && $rank <= 3 && $row->getScorePoints() > 0) {
                $badges[] = [
                    'session_id'   => $quizId,
                    'team_session_id' => $row->getTeamSession()->getId(),
                    'session_name' => $row->getQuiz()->getNom(),
                    'session_type' => 'quiz',
                    'position'     => $rank,
                    'date'         => $row->getDateCreation()->format('Y-m-d'),
                ];
            }
        }
        return $badges;
    }

    // Example: Find all quizzes with a specific status
    public function findByStatus(string $status): array
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.status = :status')
            ->setParameter('status', $status)
            ->getQuery()
            ->getResult();
    }

    /**
     * Get detailed quiz history for user analysis
     */
    public function getUserQuizAnalysisData(int $userId): array
    {
        $qb = $this->createQueryBuilder('uq')
            ->select([
                'uq.id',
                'uq.scorePoints',
                'uq.correctAnswers',
                'uq.dateCreation',
                'uq.userAnswer',
                'q.id as quiz_id',
                'q.nom as quiz_name',
                'q.type as quiz_type',
                'q.points_total as quiz_max_points',
                'q.nb_question as quiz_total_questions'
            ])
            ->leftJoin('uq.quiz', 'q')
            ->where('uq.user = :userId')
            ->setParameter('userId', $userId)
            ->orderBy('uq.dateCreation', 'DESC');

        return $qb->getQuery()->getResult();
    }

    /**
     * Get quiz performance trends over time for analysis
     */
    public function getUserQuizPerformanceTrends(int $userId): array
    {
        $qb = $this->createQueryBuilder('uq')
            ->select([
                'uq.dateCreation',
                'uq.scorePoints'
            ])
            ->where('uq.user = :userId')
            ->setParameter('userId', $userId)
            ->orderBy('uq.dateCreation', 'ASC');

        return $qb->getQuery()->getResult();
    }

    /**
     * Get quiz type performance for analysis
     */
    public function getUserQuizTypePerformance(int $userId): array
    {
        $qb = $this->createQueryBuilder('uq')
            ->select([
                'q.type as quiz_type',
                'AVG(uq.scorePoints) as avg_score',
                'COUNT(uq.id) as total_attempts'
            ])
            ->leftJoin('uq.quiz', 'q')
            ->where('uq.user = :userId')
            ->setParameter('userId', $userId)
            ->groupBy('q.type');

        $results = $qb->getQuery()->getResult();
        
        // Convert results to expected format
        $formatted = [];
        foreach ($results as $result) {
            $formatted[] = [
                'quiz_type' => $result['quiz_type'] ?? 'Unknown',
                'avg_score' => round((float)$result['avg_score'], 2),
                'total_attempts' => (int)$result['total_attempts']
            ];
        }

        return $formatted;
    }

    /**
     * Get recent quiz activity for analysis
     */
    public function getUserRecentQuizActivity(int $userId): array
    {
        $qb = $this->createQueryBuilder('uq')
            ->select([
                'uq.dateCreation',
                'uq.scorePoints',
                'uq.correctAnswers'
            ])
            ->where('uq.user = :userId')
            ->orderBy('uq.dateCreation', 'DESC')
            ->setMaxResults(50);

        return $qb->getQuery()->getResult();
    }
}
