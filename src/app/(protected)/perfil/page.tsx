import { verifySession } from '@/auth/dal';
import { getProfileAction } from '@/actions/users/profileActions';
import PerfilClient from '@/components/perfil/PerfilClient';

export default async function PerfilPage() {
  const { user } = await verifySession();
  const profileResponse = await getProfileAction();

  return (
    <PerfilClient
      user={
        profileResponse.ok
          ? profileResponse.data
          : {
              ...user,
              confirmed: true,
              profileImageUrl: null,
              authProvider: 'local',
            }
      }
    />
  );
}
