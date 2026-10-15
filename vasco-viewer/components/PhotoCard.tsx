import Image from "next/image";
import type { Photo } from "@/lib/scraper";

type Props = { photo: Photo; username: string; index: number; priority?: boolean };

export default function PhotoCard({ photo, username, index, priority }: Props) {
  const downloadHref = `/api/download?url=${encodeURIComponent(photo.url)}&name=${username}-${index + 1}`;

  return (
    <div className="group relative aspect-square overflow-hidden bg-line">
      {/* Abre a imagem original em nova aba */}
      <a href={photo.url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir foto ${index + 1} em tamanho original`}>
        <Image
          src={photo.url}
          alt={`Foto ${index + 1} de ${username}`}
          fill
          unoptimized
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-opacity duration-300 group-hover:opacity-90"
        />
      </a>
      <a
        href={downloadHref}
        download
        className="absolute bottom-2 right-2 bg-paper/85 px-2 py-1 text-[11px] text-ink transition-opacity hover:bg-paper focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        Baixar
      </a>
    </div>
  );
}
