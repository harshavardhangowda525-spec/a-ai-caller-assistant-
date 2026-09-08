import Reveal from '@/components/glass/Reveal';

export default function SectionHeading({
  eyebrow,
  title,
  sub,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  center?: boolean;
}) {
  return (
    <Reveal className={center ? 'text-center' : ''}>
      {eyebrow && <p className="section-eyebrow mb-3">{eyebrow}</p>}
      <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cream-100 sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-4 max-w-2xl text-sm leading-relaxed text-cream-200/75 sm:text-base ${
            center ? 'mx-auto' : ''
          }`}
        >
          {sub}
        </p>
      )}
    </Reveal>
  );
}
