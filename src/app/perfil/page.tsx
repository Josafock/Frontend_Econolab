import { verifySession } from '@/auth/dal';
import PerfilClient from '@/components/perfil/PerfilClient';

export default async function PerfilPage() {
  const { user } = await verifySession();

  return <PerfilClient user={user} />;
}
