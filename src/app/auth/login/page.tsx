'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ApkDownloadModal from '@/components/modals/ApkDownloadModal';
import { shouldOfferApkModal } from '@/lib/apk';
import { hubUrl } from '@/lib/auth-redirect';
import { isLikelyTV } from '@/lib/tv-navigation';

// Login deixou de ser local — pixgo.qzz.io não tem mais UI própria de
// autenticação. Redireciona para o hub central (app.pixgo.qzz.io), que
// concentra login/registo (incluindo "Continuar com Google") para todas
// as plataformas *.pixgo.qzz.io. Evita duplicar o botão Google (e o resto
// do formulário) em cada uma das ferramentas separadamente.
//
// Convite do APK: quem chega ao site SEM sessão passa por aqui antes do hub, por isso é
// aqui que o modal aparece (só no site, em Android; ver ApkDownloadModal). Com o modal
// aberto o redirecionamento espera; "Continuar no site" segue para o login do hub.
const HUB_LOGIN_URL = 'https://app.pixgo.qzz.io/auth/login';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [offerApk, setOfferApk] = useState(false);

  const goToHub = () => {
    // Preserva para onde mandar o utilizador de volta depois do login —
    // se quem chamou já passou um return_to explícito, respeita; senão,
    // volta para /main (mesmo destino que o login local sempre teve).
    const explicitReturnTo = searchParams.get('return_to');
    const returnTo = explicitReturnTo
      ? decodeURIComponent(explicitReturnTo)
      : `${window.location.origin}/main`;

    window.location.replace(hubUrl(HUB_LOGIN_URL, returnTo));
  };

  useEffect(() => {
    // TV: o destino é /auth/tv (código de 6 dígitos + link para utilizador e senha), não o hub direto.
    if (isLikelyTV()) {
      const rt = searchParams.get('return_to');
      window.location.replace(rt ? `/auth/tv?return_to=${encodeURIComponent(rt)}` : '/auth/tv');
      return;
    }
    if (shouldOfferApkModal()) { setOfferApk(true); return; }   // espera pela escolha da pessoa
    goToHub();
  }, [searchParams]);

  return (
    <div className="auth-page">
      {offerApk ? <ApkDownloadModal standalone onFinish={goToHub} /> : <div className="loading-ring" />}
    </div>
  );
}
