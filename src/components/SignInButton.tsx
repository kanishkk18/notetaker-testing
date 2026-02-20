'use client';

import { signIn } from 'next-auth/react';
import { Button } from './ui/button';
import { Chrome } from 'lucide-react';

export function SignInButton() {
  return (
    <Button onClick={() => signIn('google', { callbackUrl: '/dashboard' })} >
      <Chrome className="w-5 h-5 mr-2" />
      Sign in with Google
    </Button>
  );
}