<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * Permet de mettre à jour (rehash) le mot de passe d’un utilisateur.
     */
    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', get_class($user)));
        }

        $user->setPassword($newHashedPassword);
        $this->_em->persist($user);
        $this->_em->flush();
    }

    /**
     * Trouver un utilisateur par son email.
     */
    public function findByEmail(string $email): ?User
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.email = :email')
            ->setParameter('email', $email)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouver tous les utilisateurs par rôle.
     */
    public function findByRole(string $role): array
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.role = :role')
            ->setParameter('role', $role)
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtenir les utilisateurs triés par points (top classement).
     */
    public function findTopUsersByPoints(int $limit = 10): array
    {
        return $this->createQueryBuilder('u')
            ->orderBy('u.points_total_all', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Get comprehensive user data for analysis including profile and basic stats
     */
    public function getUserAnalysisData(int $userId): ?array
    {
        $user = $this->find($userId);
        
        if (!$user) {
            return null;
        }

        return [
            'id' => $user->getId(),
            'username' => $user->getUsername(),
            'email' => $user->getEmail(),
            'role' => $user->getRole()->value,
            'rank' => $user->getRank()->value,
            'points_total_all' => $user->getPointsTotalAll(),
            'status' => $user->getStatus(),
            'date_creation' => $user->getDateCreation(),
            'image' => $user->getImage(),
            'cv' => $user->getCv(),
            'profile_attributes' => $user->getProfileAttributes(),
        ];
    }

    /**
     * Get user performance statistics for analysis
     */
    public function getUserPerformanceStats(int $userId): array
    {
        $qb = $this->createQueryBuilder('u')
            ->select([
                'u.id',
                'u.username',
                'u.points_total_all',
                'u.date_creation',
                'COUNT(DISTINCT uq.id) as total_quizzes',
                'AVG(uq.scorePoints) as avg_quiz_score',
                'SUM(uq.scorePoints) as total_quiz_points',
                'COUNT(DISTINCT upp.id) as total_programming_problems',
                'AVG(upp.scorePoints) as avg_programming_score',
                'SUM(upp.scorePoints) as total_programming_points'
            ])
            ->leftJoin('App\Entity\UserQuiz', 'uq', 'WITH', 'uq.user = u.id')
            ->leftJoin('App\Entity\UserProgProblem', 'upp', 'WITH', 'upp.user = u.id')
            ->where('u.id = :userId')
            ->setParameter('userId', $userId)
            ->groupBy('u.id');

        $result = $qb->getQuery()->getOneOrNullResult();

        return [
            'user_id' => $result['id'] ?? null,
            'username' => $result['username'] ?? null,
            'total_points' => $result['points_total_all'] ?? 0,
            'account_age_days' => $result['date_creation'] ? 
                (new \DateTime())->diff($result['date_creation'])->days : 0,
            'quiz_stats' => [
                'total_attempts' => (int)($result['total_quizzes'] ?? 0),
                'average_score' => round((float)($result['avg_quiz_score'] ?? 0), 2),
                'total_points' => (int)($result['total_quiz_points'] ?? 0),
            ],
            'programming_stats' => [
                'total_attempts' => (int)($result['total_programming_problems'] ?? 0),
                'average_score' => round((float)($result['avg_programming_score'] ?? 0), 2),
                'total_points' => (int)($result['total_programming_points'] ?? 0),
            ]
        ];
    }

    /**
     * Get users with basic data for batch analysis
     */
    public function getUsersForBatchAnalysis(array $userIds): array
    {
        return $this->createQueryBuilder('u')
            ->select([
                'u.id',
                'u.username',
                'u.email',
                'u.role',
                'u.rank',
                'u.points_total_all',
                'u.status',
                'u.date_creation'
            ])
            ->where('u.id IN (:userIds)')
            ->setParameter('userIds', $userIds)
            ->getQuery()
            ->getResult();
    }

    /**
     * Find users who are not assigned to any team.
     *
     * @return User[]
     */
    public function findUsersWithoutTeam(): array
    {
        return $this->createQueryBuilder('u')
            ->leftJoin('u.teams', 't')
            ->where('t.id IS NULL')
            ->getQuery()
            ->getResult();
    }
}
