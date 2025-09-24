<?php

namespace App\Command;

use App\Entity\TeamSession;
use App\Repository\TeamSessionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:team-sessions:update-statuses',
    description: 'Met à jour automatiquement le status des TeamSessions programmées dont la date de début est passée.'
)]
class UpdateTeamSessionsStatusesCommand extends Command
{
    private TeamSessionRepository $sessionRepo;
    private EntityManagerInterface $em;

    public function __construct(TeamSessionRepository $sessionRepo, EntityManagerInterface $em)
    {
        parent::__construct();
        $this->sessionRepo = $sessionRepo;
        $this->em = $em;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $now = new \DateTimeImmutable();
        $sessions = $this->sessionRepo->findScheduledSessionsToStart($now);
        $updated = 0;
        foreach ($sessions as $session) {
            $session->setStatus(TeamSession::STATUS_INPROGRESS);
            $updated++;
        }
        if ($updated > 0) {
            $this->em->flush();
        }
        $output->writeln("<info>Sessions mises à jour : $updated</info>");
        $output->writeln("Date d'exécution : " . $now->format('c'));
        return Command::SUCCESS;
    }
}
