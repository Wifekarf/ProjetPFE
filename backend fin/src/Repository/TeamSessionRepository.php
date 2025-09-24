<?php

namespace App\Repository;

use App\Entity\TeamSession;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use APP\Entity\Team;
/**
 * @extends ServiceEntityRepository<TeamSession>
 */
class TeamSessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TeamSession::class);
    }

    /**
     * Trouve la session d'équipe active pour un utilisateur.
     * @param \App\Entity\User $user
     * @return TeamSession|null
     */
    public function findCurrentForUser($user): ?TeamSession
    {
        return $this->createQueryBuilder('ts')
            ->join('ts.team', 'team')
            ->andWhere(':user MEMBER OF team.members')
            ->andWhere('ts.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', 'active')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Retourne les sessions scheduled dont la date de début est passée.
     * @param \DateTimeInterface $now
     * @return TeamSession[]
     */
    public function findScheduledSessionsToStart(\DateTimeInterface $now): array
    {
        return $this->createQueryBuilder('s')
            ->where('s.status = :status')
            ->andWhere('s.startDateTime <= :now')
            ->setParameter('status', TeamSession::STATUS_SCHEDULED)
            ->setParameter('now', $now)
            ->getQuery()
            ->getResult();
    }

    /**
     * Find sessions whose startedAt is within $intervalMinutes of $date.
     *
     * @param \DateTimeInterface $date
     * @param int $intervalMinutes
     * @return QuizSession[]
     */
    public function findSessionsCloseTo(Team $team, \DateTimeInterface $date, int $intervalMinutes = 60): array
    {
        $start = (clone $date)->modify("-{$intervalMinutes} minutes");
        $end = (clone $date)->modify("+{$intervalMinutes} minutes");
        return $this->createQueryBuilder('s')
            ->where('s.startDateTime BETWEEN :start AND :end')
            ->andWhere('s.team = :team')
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->setParameter('team', $team)
            ->getQuery()
            ->getResult();
    }

}