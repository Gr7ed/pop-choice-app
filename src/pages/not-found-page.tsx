import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { LuCompass } from 'react-icons/lu';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export default function NotFoundPage(): ReactElement {
  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      <Card className="items-center gap-4 px-6 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <LuCompass className="size-5" aria-hidden="true" />
        </span>
        <p className="text-kicker text-xs">Error 404</p>
        <h1 className="font-heading text-3xl text-foreground">This reel doesn’t exist</h1>
        <p className="max-w-md text-muted-foreground">
          The page you were looking for has left the building. Let’s get you back to the movies.
        </p>
        <Button asChild className="rounded-full px-5">
          <Link to="/">Back to home</Link>
        </Button>
      </Card>
    </div>
  );
}
