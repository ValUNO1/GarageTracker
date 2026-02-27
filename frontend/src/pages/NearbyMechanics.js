import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
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
  const { t } = useLanguage();
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
    { label: t('autoMechanic'), query: 'auto mechanic near me' },
    { label: t('oilChangeService'), query: 'oil change service near me' },
    { label: t('brakeRepair'), query: 'brake repair shop near me' },
    { label: t('tireShop'), query: 'tire shop near me' },
    { label: t('autoParts'), query: 'auto parts store near me' },
    { label: t('carWash'), query: 'car wash near me' },
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="nearby-mechanics-page">
      <div>
        <h1 className="text-3xl font-outfit font-bold text-foreground">{t('findNearbyMechanicsTitle')}</h1>
        <p className="text-muted-foreground mt-1">{t('locateTrustedShops')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Search Card */}
        <Card className="lg:col-span-2 card-base">
          <CardHeader>
            <CardTitle className="text-lg font-outfit flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              {t('locationSearch')}
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
                  <span className="text-sm">{t('gettingLocation')}</span>
                </div>
              ) : location ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Navigation className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">{t('locationFound')}</p>
                      <p className="text-sm text-muted-foreground">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={getLocation}>
                    {t('refresh')}
                  </Button>
                </div>
              ) : error ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-400">{t('locationError')}</p>
                      <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={getLocation}>
                    {t('retry')}
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
                  placeholder={t('searchForAutoServices')}
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
                {t('searchOnMaps')}
              </Button>
            </div>

            {/* Quick Searches */}
            <div>
              <p className="text-sm font-medium mb-3">{t('quickSearches')}</p>
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
            <CardTitle className="text-lg font-outfit">{t('findingGoodMechanic')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="font-medium mb-1">{t('checkReviews')}</p>
                <p className="text-muted-foreground">{t('checkReviewsDesc')}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="font-medium mb-1">{t('askCertifications')}</p>
                <p className="text-muted-foreground">{t('askCertificationsDesc')}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="font-medium mb-1">{t('getWrittenEstimates')}</p>
                <p className="text-muted-foreground">{t('getWrittenEstimatesDesc')}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="font-medium mb-1">{t('askWarranties')}</p>
                <p className="text-muted-foreground">{t('askWarrantiesDesc')}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">{t('needRoadsideAssistance')}</p>
              <Button variant="outline" className="w-full" onClick={() => openGoogleMaps('roadside assistance near me')}>
                <MapPin className="w-4 h-4 mr-2" />
                {t('findRoadsideHelp')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Embed Placeholder */}
      {location && process.env.REACT_APP_GOOGLE_MAPS_KEY && (
        <Card className="card-base overflow-hidden">
          <CardContent className="p-0">
            <iframe
              title="Location Map"
              width="100%"
              height="400"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/search?key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}&q=auto+mechanic&center=${location.lat},${location.lng}&zoom=13`}
              data-testid="map-embed"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
