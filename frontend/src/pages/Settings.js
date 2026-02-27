import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Sun, 
  Moon, 
  Bell, 
  Mail, 
  Save,
  Palette,
  Globe,
  Ruler
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || ''}/api`.replace(/([^:]\/)\/+/g, '$1');

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t, languageNames } = useLanguage();
  const [settings, setSettings] = useState({
    email_reminders: true,
    push_notifications: true,
    reminder_days_before: 7
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/settings`, settings);
      toast.success(t('settingsSaved'));
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl" data-testid="settings-page">
      <div>
        <h1 className="text-3xl font-outfit font-bold text-foreground">{t('settings')}</h1>
        <p className="text-muted-foreground mt-1">{t('managePreferences')}</p>
      </div>

      {/* Language */}
      <Card className="card-base">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-outfit">{t('language')}</CardTitle>
              <CardDescription>{t('selectLanguage')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-48" data-testid="language-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(languageNames).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="card-base">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <Palette className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-outfit">{t('appearance')}</CardTitle>
              <CardDescription>{t('customizeAppearance')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'light' ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-400" />
              )}
              <div>
                <Label className="text-base">{t('theme')}</Label>
                <p className="text-sm text-muted-foreground">{t('chooseLightDark')}</p>
              </div>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-32" data-testid="theme-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    {t('light')}
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    {t('dark')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="card-base">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-outfit">{t('notifications')}</CardTitle>
              <CardDescription>{t('configureReminders')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="text-base">{t('emailReminders')}</Label>
                <p className="text-sm text-muted-foreground">{t('emailRemindersDesc')}</p>
              </div>
            </div>
            <Switch
              checked={settings.email_reminders}
              onCheckedChange={(checked) => setSettings({ ...settings, email_reminders: checked })}
              data-testid="email-reminders-switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="text-base">{t('inAppNotifications')}</Label>
                <p className="text-sm text-muted-foreground">{t('inAppNotificationsDesc')}</p>
              </div>
            </div>
            <Switch
              checked={settings.push_notifications}
              onCheckedChange={(checked) => setSettings({ ...settings, push_notifications: checked })}
              data-testid="push-notifications-switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">{t('reminderLeadTime')}</Label>
              <p className="text-sm text-muted-foreground">{t('reminderLeadTimeDesc')}</p>
            </div>
            <Select 
              value={settings.reminder_days_before?.toString()} 
              onValueChange={(v) => setSettings({ ...settings, reminder_days_before: parseInt(v) })}
            >
              <SelectTrigger className="w-32" data-testid="reminder-days-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 {t('days')}</SelectItem>
                <SelectItem value="7">7 {t('days')}</SelectItem>
                <SelectItem value="14">14 {t('days')}</SelectItem>
                <SelectItem value="30">30 {t('days')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-8"
          data-testid="save-settings-button"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('saving')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {t('saveSettings')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
