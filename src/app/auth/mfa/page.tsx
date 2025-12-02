import MfaForm from '@/components/auth/MfaForm';

export default function MfaPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email ?? '';
  return <MfaForm email={email} />;
}
