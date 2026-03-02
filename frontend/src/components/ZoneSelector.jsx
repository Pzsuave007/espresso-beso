import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { useZone } from '../App';

export default function ZoneSelector({ onSelect }) {
  const { zones, selectedZone, setSelectedZone, selectedTimeWindow, setSelectedTimeWindow } = useZone();

  const handleZoneSelect = (zone) => {
    setSelectedZone(zone);
    if (zone.time_windows && zone.time_windows.length > 0) {
      setSelectedTimeWindow(zone.time_windows[0]);
    }
    if (onSelect) {
      onSelect(zone);
    }
  };

  const handleTimeSelect = (timeWindow) => {
    setSelectedTimeWindow(timeWindow);
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-4" data-testid="zone-selector">
      <h3 className="font-serif text-xl font-semibold text-espresso">Select Your Zone</h3>
      
      <div className="grid gap-3">
        {zones.map((zone) => (
          <div key={zone.id} className="space-y-2">
            <button
              onClick={() => handleZoneSelect(zone)}
              className={`zone-card w-full ${selectedZone?.id === zone.id ? 'active' : ''}`}
              data-testid={`zone-${zone.id}`}
            >
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-espresso">{zone.name}</p>
                {zone.time_windows && zone.time_windows.length > 0 && (
                  <p className="text-sm text-espresso/60">
                    {formatTime(zone.time_windows[0].start)} - {formatTime(zone.time_windows[0].end)}
                  </p>
                )}
              </div>
              <ChevronRight className={`w-5 h-5 transition-transform ${selectedZone?.id === zone.id ? 'rotate-90 text-gold' : 'text-espresso/40'}`} />
            </button>

            {/* Time Window Selection */}
            {selectedZone?.id === zone.id && zone.time_windows && zone.time_windows.length > 1 && (
              <div className="pl-12 space-y-2 animate-fade-in">
                <p className="text-sm font-medium text-espresso/70 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Select Time Window
                </p>
                <div className="flex flex-wrap gap-2">
                  {zone.time_windows.map((tw, index) => (
                    <button
                      key={index}
                      onClick={() => handleTimeSelect(tw)}
                      className={`customization-option text-sm ${
                        selectedTimeWindow?.start === tw.start ? 'selected' : ''
                      }`}
                      data-testid={`time-window-${index}`}
                    >
                      {formatTime(tw.start)} - {formatTime(tw.end)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {zones.length === 0 && (
        <div className="text-center py-8 text-espresso/60">
          <p>No zones available at this time</p>
        </div>
      )}
    </div>
  );
}
