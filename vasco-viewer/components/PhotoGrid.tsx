import type { Photo } from "@/lib/scraper";
import PhotoCard from "./PhotoCard";

export default function PhotoGrid({ photos, username }: { photos: Photo[]; username: string }) {
  if (photos.length === 0) {
    return <p className="px-6 py-16 text-center text-sm text-mute">Este perfil não tem fotos públicas.</p>;
  }
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-[2px] sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo, i) => (
        <PhotoCard key={photo.id} photo={photo} username={username} index={i} priority={i < 4} />
      ))}
    </div>
  );
}
