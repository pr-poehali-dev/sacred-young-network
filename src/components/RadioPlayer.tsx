import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Slider } from '@/components/ui/slider';

interface RadioStation {
  id: number;
  name: string;
  genre: string;
  stream_url: string;
  listeners: number;
}

interface RadioPlayerProps {
  stations: RadioStation[];
  currentStationId: number | null;
  onStationChange: (stationId: number | null) => void;
}

const RadioPlayer = ({ stations, currentStationId, onStationChange }: RadioPlayerProps) => {
  const [volume, setVolume] = useState(70);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentStation = stations.find(s => s.id === currentStationId);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (currentStationId && currentStation) {
      playStation();
    } else {
      stopStation();
    }
  }, [currentStationId]);

  const playStation = async () => {
    if (audioRef.current && currentStation) {
      try {
        audioRef.current.src = currentStation.stream_url;
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to play radio:', error);
        setIsPlaying(false);
      }
    }
  };

  const stopStation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      onStationChange(null);
    } else if (currentStation) {
      playStation();
    }
  };

  const handleStationClick = (stationId: number) => {
    if (currentStationId === stationId) {
      onStationChange(null);
    } else {
      onStationChange(stationId);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-yellow-500 text-black border-2 border-yellow-400">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center">
            <Icon name="Radio" size={36} className="text-yellow-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">Радио онлайн</h2>
            <p className="text-gray-800">Слушай любимые станции 24/7</p>
          </div>
        </div>

        {currentStation && (
          <div className="space-y-3 mt-4 p-4 bg-black rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-500 font-bold">{currentStation.name}</p>
                <p className="text-gray-400 text-sm">{currentStation.genre}</p>
              </div>
              <Button
                size="icon"
                onClick={togglePlay}
                className="bg-yellow-500 hover:bg-yellow-400 text-black"
              >
                <Icon name={isPlaying ? "Pause" : "Play"} size={20} />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Icon name="Volume2" size={18} className="text-yellow-500" />
              <Slider
                value={[volume]}
                onValueChange={(val) => setVolume(val[0])}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-yellow-500 text-sm font-mono w-10">{volume}%</span>
            </div>

            {isPlaying && (
              <div className="flex items-center gap-2 text-blue-400 text-sm animate-pulse">
                <Icon name="Radio" size={16} />
                <span>В эфире...</span>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {stations.map((station) => (
          <Card
            key={station.id}
            className={`p-5 bg-black border-2 transition-all cursor-pointer ${
              currentStationId === station.id
                ? 'border-blue-400 bg-gray-900'
                : 'border-yellow-500 hover:border-white'
            }`}
            onClick={() => handleStationClick(station.id)}
          >
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                className={`${
                  currentStationId === station.id
                    ? 'bg-blue-400 hover:bg-blue-500'
                    : 'bg-yellow-500 hover:bg-yellow-400'
                } text-black`}
              >
                <Icon name={currentStationId === station.id && isPlaying ? "Pause" : "Play"} size={20} />
              </Button>
              <div className="flex-1">
                <h4 className="font-bold text-yellow-500">{station.name}</h4>
                <p className="text-sm text-gray-400">{station.genre}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Icon name="Users" size={14} />
                  {station.listeners}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <audio ref={audioRef} preload="none" />
    </div>
  );
};

export default RadioPlayer;
