import Image from "next/image";
import type { VscoProfile } from "@/lib/scraper";

export default function ProfileHeader({ profile }: { profile: VscoProfile }) {
  return (
    <header className="flex flex-col items-center px-6 pb-8 pt-10 text-center">
      {profile.avatar ? (
        <Image
          src={profile.avatar}
          alt={`Foto de perfil de ${profile.name}`}
          width={88}
          height={88}
          unoptimized
          className="h-[88px] w-[88px] rounded-full object-cover"
        />
      ) : (
        <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-line text-2xl text-mute">
          {profile.name.charAt(0).toUpperCase()}
        </div>
      )}
      <h1 className="mt-4 text-2xl font-light tracking-wide">{profile.name}</h1>
      <p className="mt-1 text-sm text-mute">@{profile.username}</p>
      {profile.bio && (
        <p className="mt-3 max-w-md whitespace-pre-line text-sm leading-relaxed text-ink/80">{profile.bio}</p>
      )}
    </header>
  );
}
