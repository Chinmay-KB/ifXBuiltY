type Props = { params: Promise<{ slug: string }> };

export default async function GenerationPublicPage({ params }: Props) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Generation <span className="font-mono text-zinc-500">{slug}</span>
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Public generation page — implementation TBD.
      </p>
    </div>
  );
}
