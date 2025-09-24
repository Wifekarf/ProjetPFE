<?php

namespace App\Security;

use App\Repository\UserRepository;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Validation\Constraint\SignedWith;
use Lcobucci\JWT\Validation\Constraint\ValidAt;
use Lcobucci\Clock\SystemClock;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

class JwtAuthenticator extends AbstractAuthenticator
{
    private UserRepository $userRepository;
    private Configuration $jwtConfig;

    public function __construct(UserRepository $userRepository, ParameterBagInterface $params)
    {
        $this->userRepository = $userRepository;
        $jwtSecret = $params->get('jwt_secret_key');
        
        // Configuration for lcobucci/jwt v4.0.4
        $this->jwtConfig = Configuration::forSymmetricSigner(
            new Sha256(),
            InMemory::plainText($jwtSecret)
        );
        
        // Set validation constraints
        $this->jwtConfig->setValidationConstraints(
            new SignedWith($this->jwtConfig->signer(), $this->jwtConfig->signingKey()),
            new ValidAt(SystemClock::fromUTC())
        );
    }

    public function supports(Request $request): ?bool
    {
        return $request->headers->has('Authorization');
    }

    public function authenticate(Request $request): Passport
    {
        $authHeader = $request->headers->get('Authorization');
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            throw new CustomUserMessageAuthenticationException('No API token provided');
        }

        $token = substr($authHeader, 7);

        try {
            $parsedToken = $this->jwtConfig->parser()->parse($token);
            
            // Validate the token
            $constraints = $this->jwtConfig->validationConstraints();
            $this->jwtConfig->validator()->assert($parsedToken, ...$constraints);

            // Get user ID from token - try different claim names
            $claims = $parsedToken->claims;
            $userId = $claims->get('user_id') ?? $claims->get('sub') ?? $claims->get('userId') ?? $claims->get('id');
            
            if (!$userId) {
                throw new CustomUserMessageAuthenticationException('Invalid token: no user ID found');
            }

            return new SelfValidatingPassport(
                new UserBadge((string)$userId, function ($userId) {
                    $user = $this->userRepository->find($userId);
                    if (!$user) {
                        throw new CustomUserMessageAuthenticationException('User not found');
                    }
                    return $user;
                })
            );

        } catch (\Lcobucci\JWT\Validation\RequiredConstraintsViolated $e) {
            throw new CustomUserMessageAuthenticationException('Token validation failed: ' . $e->getMessage());
        } catch (\Lcobucci\JWT\Exception $e) {
            throw new CustomUserMessageAuthenticationException('Invalid JWT token: ' . $e->getMessage());
        } catch (\Exception $e) {
            throw new CustomUserMessageAuthenticationException('Authentication failed: ' . $e->getMessage());
        }
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        $data = [
            'message' => $exception->getMessage()
        ];

        return new JsonResponse($data, Response::HTTP_UNAUTHORIZED);
    }
}