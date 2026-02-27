import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Car, 
  Plus, 
  Gauge, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Wrench,
  ChevronRight,
  Droplet,
  Disc,
  Wind,
  Thermometer,
  BatteryCharging,
  Upload,
  Link as LinkIcon,
  X,
  ImageIcon
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const maintenanceIcons = {
  oil_change: Droplet,
  air_filter: Wind,
  cabin_filter: Wind,
  coolant: Thermometer,
  brakes: Disc,
  brake_fluid: Droplet,
  battery: BatteryCharging,
  tire_rotation: Gauge,
  default: Wrench
};

const carPlaceholders = [
  'https://images.unsplash.com/photo-1562412386-e48a8277c959?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1653325189816-5d8dc746cc16?auto=format&fit=crop&q=80&w=400',
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [cars, setCars] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addCarOpen, setAddCarOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageMethod, setImageMethod] = useState('upload');
  const [newCar, setNewCar] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    license_plate: '',
    current_mileage: 0,
    image_url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, carsRes, tasksRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`),
        axios.get(`${API_URL}/cars`),
        axios.get(`${API_URL}/maintenance`)
      ]);
      setStats(statsRes.data);
      setCars(carsRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    try {
      const carData = { ...newCar };
      if (imagePreview && imageMethod === 'upload') {
        carData.image_url = imagePreview;
      }
      await axios.post(`${API_URL}/cars`, carData);
      toast.success('Car added successfully!');
      setAddCarOpen(false);
      setNewCar({ make: '', model: '', year: new Date().getFullYear(), color: '', license_plate: '', current_mileage: 0, image_url: '' });
      setImagePreview(null);
      setImageMethod('upload');
      fetchData();
    } catch (error) {
      toast.error('Failed to add car');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (url) => {
    setNewCar({ ...newCar, image_url: url });
    if (url) {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setNewCar({ ...newCar, image_url: '' });
  };

  const upcomingTasks = tasks
    .filter(t => t.status === 'due_soon' || t.status === 'overdue')
    .sort((a, b) => (a.status === 'overdue' ? -1 : 1))
    .slice(0, 5);

  const getCarName = (carId) => {
    const car = cars.find(c => c.id === carId);
    return car ? `${car.year} ${car.make} ${car.model}` : 'Unknown Car';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-outfit font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your vehicle maintenance</p>
        </div>
        <Dialog open={addCarOpen} onOpenChange={setAddCarOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6" data-testid="add-car-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-outfit">Add New Vehicle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCar} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    placeholder="Toyota"
                    value={newCar.make}
                    onChange={(e) => setNewCar({ ...newCar, make: e.target.value })}
                    required
                    data-testid="car-make-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="Camry"
                    value={newCar.model}
                    onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                    required
                    data-testid="car-model-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select 
                    value={newCar.year.toString()} 
                    onValueChange={(v) => setNewCar({ ...newCar, year: parseInt(v) })}
                  >
                    <SelectTrigger data-testid="car-year-select">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    placeholder="Silver"
                    value={newCar.color}
                    onChange={(e) => setNewCar({ ...newCar, color: e.target.value })}
                    data-testid="car-color-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_plate">License Plate</Label>
                  <Input
                    id="license_plate"
                    placeholder="ABC-1234"
                    value={newCar.license_plate}
                    onChange={(e) => setNewCar({ ...newCar, license_plate: e.target.value })}
                    data-testid="car-plate-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_mileage">Current Mileage</Label>
                  <Input
                    id="current_mileage"
                    type="number"
                    placeholder="50000"
                    value={newCar.current_mileage}
                    onChange={(e) => setNewCar({ ...newCar, current_mileage: parseInt(e.target.value) || 0 })}
                    data-testid="car-mileage-input"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" data-testid="submit-car-button">
                Add Vehicle
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Stats Card */}
        <Card className="md:col-span-8 card-base animate-fade-in-delay-1" data-testid="stats-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-outfit">Maintenance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm text-muted-foreground">Vehicles</span>
                </div>
                <p className="text-3xl font-outfit font-bold">{stats?.total_cars || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-muted-foreground">Good</span>
                </div>
                <p className="text-3xl font-outfit font-bold text-emerald-600">{stats?.good || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-muted-foreground">Due Soon</span>
                </div>
                <p className="text-3xl font-outfit font-bold text-amber-600">{stats?.due_soon || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-muted-foreground">Overdue</span>
                </div>
                <p className="text-3xl font-outfit font-bold text-red-600">{stats?.overdue || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="md:col-span-4 card-base animate-fade-in-delay-2" data-testid="quick-actions-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-outfit">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/nearby-mechanics">
              <Button variant="outline" className="w-full justify-start h-12 rounded-xl" data-testid="quick-find-mechanics">
                <Gauge className="w-5 h-5 mr-3 text-indigo-600" />
                <span>Find Nearby Mechanics</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicles */}
        <Card className="card-base animate-fade-in-delay-2" data-testid="vehicles-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-outfit">My Vehicles</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setAddCarOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {cars.length === 0 ? (
              <div className="text-center py-8">
                <Car className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No vehicles added yet</p>
                <Button 
                  variant="link" 
                  className="text-indigo-600 mt-2"
                  onClick={() => setAddCarOpen(true)}
                >
                  Add your first vehicle
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cars.map((car, index) => (
                  <Link key={car.id} to={`/cars/${car.id}`} data-testid={`car-link-${car.id}`}>
                    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                      <img
                        src={car.image_url || carPlaceholders[index % carPlaceholders.length]}
                        alt={`${car.make} ${car.model}`}
                        className="w-16 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {car.year} {car.make} {car.model}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Gauge className="w-3.5 h-3.5" />
                          <span>{car.current_mileage?.toLocaleString() || 0} miles</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="card-base animate-fade-in-delay-3" data-testid="tasks-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-outfit">Upcoming Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                <p className="text-muted-foreground">All maintenance up to date!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const IconComponent = maintenanceIcons[task.task_type] || maintenanceIcons.default;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                      data-testid={`task-${task.id}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        task.status === 'overdue' 
                          ? 'bg-red-100 dark:bg-red-900/30' 
                          : 'bg-amber-100 dark:bg-amber-900/30'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          task.status === 'overdue' ? 'text-red-600' : 'text-amber-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground capitalize">
                          {task.task_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {getCarName(task.car_id)}
                        </p>
                      </div>
                      <Badge className={task.status === 'overdue' ? 'status-overdue' : 'status-due-soon'}>
                        {task.status === 'overdue' ? 'Overdue' : 'Due Soon'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
