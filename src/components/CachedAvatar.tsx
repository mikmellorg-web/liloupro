import React, { useState, useEffect } from 'react';
import { getCachedPhoto, syncPhotoCache } from '../services/photoCache';

interface CachedAvatarProps {
  photoUrl?: string;
  alt?: string;
  className?: string;
  fallbackText?: string;
}

export function CachedAvatar({ photoUrl, alt = '', className = '', fallbackText = '?' }: CachedAvatarProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!photoUrl) {
      setCurrentSrc(null);
      return;
    }

    let isSubscribed = true;

    async function loadAndSync() {
      // 1. Tenta carregar do cache instantaneamente (IndexedDB)
      const cached = await getCachedPhoto(photoUrl);
      if (cached && isSubscribed) {
        setCurrentSrc(cached);
      } else if (photoUrl.startsWith('data:') && isSubscribed) {
        // Se for imagem base64 pura (tirada com a câmera), já define direto
        setCurrentSrc(photoUrl);
      } else if (isSubscribed) {
        // Se não houver cache do link remoto, exibe o link original temporariamente
        setCurrentSrc(photoUrl);
      }

      // 2. Atualiza em segundo plano (Firebase Storage / CDN externa)
      try {
        const syncedSrc = await syncPhotoCache(photoUrl);
        if (syncedSrc && isSubscribed) {
          setCurrentSrc(syncedSrc);
        }
      } catch (err) {
        // Erro silencioso sem quebrar o componente
      }
    }

    loadAndSync();

    return () => {
      isSubscribed = false;
    };
  }, [photoUrl]);

  if (!photoUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-zinc-800 text-white font-bold uppercase select-none`}>
        {fallbackText[0] || '?'}
      </div>
    );
  }

  return (
    <img
      src={currentSrc || photoUrl}
      alt={alt}
      className={`${className} object-cover`}
      referrerPolicy="no-referrer"
      onError={(e) => {
        // Caso ocorra falha de CORS ou link quebrado no src atualizado, recua pro original
        const imgEl = e.currentTarget;
        if (imgEl.src !== photoUrl) {
          imgEl.src = photoUrl;
        }
      }}
    />
  );
}
