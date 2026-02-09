import { generateId } from './auth';

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  embedUrl: string;
  duration: string;
  order: number;
  createdAt: string;
}

const VIDEOS_KEY = 'gameaccess_videos';

export const DISCOVERED_VIDEOS = [
  'Sensibilidade Alta [Vídeo 2].mp4',
  'Sensibilidade Alta.mp4',
  'Sensibilidade Baixa.mp4',
  'Sensibilidade Média.mp4',
  'Tutorial MOV LEFT.mp4',
  'Tutorial do HUD + Emoji Rápido.mp4',
  'Tutorial do HUD + Movimentação.mp4'
];

const DEFAULT_VIDEOS: Video[] = [
  {
    id: '1',
    title: 'Fundamentos & Controles',
    description: 'Domine os controles básicos e movimentação do personagem.',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=225&fit=crop',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '12:34',
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Tutorial do HUD + Movimentação',
    description: 'Aprenda tudo sobre o HUD e as melhores técnicas de movimentação.',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=225&fit=crop',
    embedUrl: '/videos-totorial/Tutorial do HUD + Movimentação.mp4',
    duration: '18:22',
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Sensibilidade Alta',
    description: 'As melhores configurações de sensibilidade alta para jogadores avançados.',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=225&fit=crop',
    embedUrl: '/videos-totorial/Sensibilidade Alta.mp4',
    duration: '09:15',
    order: 3,
    createdAt: new Date().toISOString(),
  }
];

function getVideosFromStorage(): Video[] {
  const data = localStorage.getItem(VIDEOS_KEY);
  if (!data) {
    localStorage.setItem(VIDEOS_KEY, JSON.stringify(DEFAULT_VIDEOS));
    return DEFAULT_VIDEOS;
  }
  return JSON.parse(data);
}

function saveVideos(videos: Video[]) {
  localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
}

export function getAllVideos(): Video[] {
  return getVideosFromStorage().sort((a, b) => a.order - b.order);
}

export function createVideo(data: Omit<Video, 'id' | 'createdAt'>): Video {
  const videos = getVideosFromStorage();
  const newVideo: Video = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  videos.push(newVideo);
  saveVideos(videos);
  return newVideo;
}

export function updateVideo(id: string, data: Partial<Omit<Video, 'id' | 'createdAt'>>) {
  const videos = getVideosFromStorage();
  const idx = videos.findIndex(v => v.id === id);
  if (idx === -1) return;
  Object.assign(videos[idx], data);
  saveVideos(videos);
}

export function deleteVideo(id: string) {
  const videos = getVideosFromStorage().filter(v => v.id !== id);
  saveVideos(videos);
}

// Deprecated: use getAllVideos()
export const VIDEOS = getVideosFromStorage();
