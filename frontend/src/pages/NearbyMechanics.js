import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  MapPin, 
  Navigation, 
  Phone,
  ExternalLink,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function NearbyMechanics() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('auto mechanic');

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (err) => {
        setError('Unable to get your location. Please enable location services.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const openGoogleMaps = (query = searchQuery) => {
    if (location) {
      const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${location.lat},${location.lng},14z`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
      window.open(url, '_blank');
    }
  };

  const quickSearches = [
    { label: 'Auto Mechanic', query: 'auto mechanic near me' },
    { label: 'Oil Change', query: 'oil change service near me' },
    { label: 'Brake Repair', query: 'brake repair shop near me' },
    { label: 'Tire Shop', query: 'tire shop near me' },
    { label: 'Auto Parts', query: 'auto parts store near me' },
    { label: 'Car Wash', query: 'car wash near me' },
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="nearby-mechanics-page">
      <div>
        <h1 className="text-3xl font-outfit font-bold text-foreground">Find Nearby Mechanics</h1>
        <p className="text-muted-foreground mt-1">Locate trusted auto shops in your area</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Search Card */}
        <Card className="lg:col-span-2 card-base">
          <CardHeader>
            <CardTitle className="text-lg font-outfit flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Location Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location Status */}
            <div className={`p-4 rounded-xl ${
              location 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' 
                : error 
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
            }`}>
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span className="text-sm">Getting your location...</span>
                </div>
              ) : location ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Navigation className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">Location Found</p>
                      <p className="text-sm text-muted-foreground">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={getLocation}>
                    Refresh
                  </Button>
                </div>
              ) : error ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-400">Location Error</p>
                      <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={getLocation}>
                    Retry
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for auto services..."
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              <Button 
                onClick={() => openGoogleMaps()} 
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="search-button"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Search on Maps
              </Button>
            </div>

            {/* Quick Searches */}
            <div>
              <p className="text-sm font-medium mb-3">Quick Searches</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickSearches.map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start h-auto py-3 px-4"
                    onClick={() => openGoogleMaps(item.query)}
                    data-testid={`quick-search-${index}`}
                  >
                    <MapPin className="w-4 h-4 mr-2 text-indigo-600 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="card-base">
          <CardHeader>
            <CardTitle className="text-lg font-outfit">Finding a Good Mechanic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="font-medium mb-1">Check Reviews</p>
                <p className="text-muted-foreground">Look for shops with 4+ stars and read recent reviews.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="font-medium mb-1">Ask About Certifications</p>
                <p className="text-muted-foreground">ASE-certified mechanics have passed industry tests.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="font-medium mb-1">Get Written Estimates</p>
                <p className="text-muted-foreground">Always get a written estimate before any work begins.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="font-medium mb-1">Ask About Warranties</p>
                <p className="text-muted-foreground">Good shops offer warranties on parts and labor.</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Need roadside assistance?</p>
              <Button variant="outline" className="w-full" onClick={() => openGoogleMaps('roadside assistance near me')}>
                <MapPin className="w-4 h-4 mr-2" />
                Find Roadside Help
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Embed Placeholder */}
      {location && (
        <Card className="card-base overflow-hidden">
          <CardContent className="p-0">
            <iframe
              title="Location Map"
              width="100%"
              height="400"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=auto+mechanic&center=${location.lat},${location.lng}&zoom=13`}
              data-testid="map-embed"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
