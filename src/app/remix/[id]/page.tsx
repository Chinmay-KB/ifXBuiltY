type Props = { params: Promise<{ id: string }> };

export default async function RemixPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Remix <span className="font-mono text-zinc-500">{id}</span>
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Preloads an existing generation into the generator — implementation TBD.
      </p>
    </div>
  );
}
