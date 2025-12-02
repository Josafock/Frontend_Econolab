import MfaForm from '@/components/auth/MfaForm';

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return <MfaForm email={email ?? ''} />;
}
