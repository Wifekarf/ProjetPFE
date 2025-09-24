<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use SymfonyCasts\Bundle\ResetPassword\ResetPasswordHelperInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use SymfonyCasts\Bundle\ResetPassword\Exception\ResetPasswordExceptionInterface;
use SymfonyCasts\Bundle\ResetPassword\Exception\TooManyPasswordRequestsException;

#[Route('/api/reset-password', name: 'api_reset_password_')]
class ResetPasswordController extends AbstractController
{
    public function __construct(
        private UserRepository               $users,
        private ResetPasswordHelperInterface $resetHelper,
        private MailerInterface              $mailer,
        private EntityManagerInterface       $em,
        private UserPasswordHasherInterface  $passwordHasher
    ) {}

    /**
     * POST /api/reset-password/request
     * { "email": "user@example.com" }
     */
    #[Route('/request', name: 'request', methods: ['POST'])]
    public function request(Request $request): JsonResponse
    {
        $data  = json_decode($request->getContent(), true);
        $email = $data['email'] ?? '';
        $user  = $this->users->findByEmail($email);

        if (!$user) {
            return $this->json(['ok' => true]);
        }

        // generateResetToken() returns a ResetPasswordToken object
        try {
            $resetPasswordToken = $this->resetHelper->generateResetToken($user);
        } catch (TooManyPasswordRequestsException $e) {
            // throttle in effect: quietly return OK
            return $this->json(['ok' => true]);
        }

        // extract the actual token string
        $tokenString = $resetPasswordToken->getToken();

        // build your React reset link
        $frontendUrl = 'http://localhost:5173';  // adjust as needed
        $resetUrl    = rtrim($frontendUrl, '/').'/reset-password/'.$tokenString;

        // send email
        $message = (new Email())
            ->from('no-reply@yourdomain.com')
            ->to($user->getEmail())
            ->subject('Reset your password')
            ->html(sprintf(
                '<p>Hello!</p>
                 <p>Click <a href="%s">here</a> to reset your password.</p>
                 <p>This link expires in 1 hour.</p>',
                $resetUrl
            ));

        $this->mailer->send($message);

        return $this->json(['ok' => true]);
    }

    /**
     * POST /api/reset-password/reset
     * { "token": "...", "password": "newpass" }
     */
  #[Route('/reset', name: 'reset', methods: ['POST'])]
public function reset(Request $request): JsonResponse
{
    $data        = json_decode($request->getContent(), true);
    $token       = $data['token']    ?? '';
    $newPassword = $data['password'] ?? '';

    try {
        $user = $this->resetHelper->validateTokenAndFetchUser($token);

        $user->setPassword(
            $this->passwordHasher->hashPassword($user, $newPassword)
        );

        $this->resetHelper->removeResetRequest($token);
        $this->em->flush();

        return $this->json(['success' => true]);
    } catch (\Throwable $e) {
        // Return error message in JSON and status 500
        return $this->json([
            'error'   => get_class($e).' : '.$e->getMessage(),
            'trace'   => explode("\n", $e->getTraceAsString())[0], 
        ], 500);
    }
}

}
