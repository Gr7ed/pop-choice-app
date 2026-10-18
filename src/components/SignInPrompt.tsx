import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { LuLockKeyhole } from 'react-icons/lu';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface SignInPromptProps {
  title: string;
  description: string;
}

/** Shown on gated routes (favorites, lists) when nobody is signed in. */
export default function SignInPrompt({ title, description }: SignInPromptProps): ReactElement {
  return (
    <Card className="mx-auto max-w-lg items-center gap-4 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <LuLockKeyhole className="size-5" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h2 className="font-heading text-xl text-foreground">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild className="rounded-full px-5">
          <Link to="/login">Log in</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full px-5">
          <Link to="/signup">Create account</Link>
        </Button>
      </div>
    </Card>
  );
}
