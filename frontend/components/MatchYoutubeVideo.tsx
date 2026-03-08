'use client';

interface MatchYoutubeVideoProps {
  youtubeUrl?: string;
}

function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null;

  // Patrones comunes de URLs de YouTube
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export default function MatchYoutubeVideo({ youtubeUrl }: MatchYoutubeVideoProps) {
  if (!youtubeUrl) {
    return null;
  }

  const videoId = extractYoutubeVideoId(youtubeUrl);

  if (!videoId) {
    // Si no se pudo extraer el ID pero hay URL, mostrar link directo
    return (
      <div className="bg-red-50 p-4 md:p-6 rounded-lg border-2 border-red-300 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-red-900 mb-1">📹 Ver en YouTube</h3>
          <p className="text-sm text-red-700">El video del partido está disponible en YouTube</p>
        </div>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition font-medium text-sm whitespace-nowrap"
        >
          Ir a YouTube →
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      <div className="relative w-full pt-[56.25%]">
        {/* Responsive YouTube embed */}
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title="Video del partido"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
