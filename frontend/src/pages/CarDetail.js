import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  ArrowLeft,
  Gauge,
  Droplet,
  Disc,
  Wind,
  Thermometer,
  BatteryCharging,
  Wrench,
  Plus,
  Trash2,
  CheckCircle2,
  CalendarDays,
  Edit,
  AlertTriangle,
  AlertOctagon,
  X
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const maintenanceTypes = [
  { value: 'oil_change', label: 'Oil Change', icon: Droplet, defaultMiles: 5000, defaultMonths: 6 },
  { value: 'air_filter', label: 'Air Filter', icon: Wind, defaultMiles: 15000, defaultMonths: 12 },
  { value: 'cabin_filter', label: 'Cabin Filter', icon: Wind, defaultMiles: 15000, defaultMonths: 12 },
  { value: 'coolant', label: 'Coolant Check', icon: Thermometer, defaultMiles: 30000, defaultMonths: 24 },
  { value: 'brakes', label: 'Brake Pads', icon: Disc, defaultMiles: 30000, defaultMonths: 24 },
  { value: 'brake_fluid', label: 'Brake Fluid', icon: Droplet, defaultMiles: 30000, defaultMonths: 24 },
  { value: 'battery', label: 'Battery Check', icon: BatteryCharging, defaultMiles: 50000, defaultMonths: 36 },
  { value: 'tire_rotation', label: 'Tire Rotation', icon: Gauge, defaultMiles: 7500, defaultMonths: 6 },
  { value: 'transmission', label: 'Transmission Fluid', icon: Wrench, defaultMiles: 60000, defaultMonths: 48 },
  { value: 'spark_plugs', label: 'Spark Plugs', icon: Wrench, defaultMiles: 60000, defaultMonths: 48 },
];

const carPlaceholders = [
  'https://images.unsplash.com/photo-1562412386-e48a8277c959?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1653325189816-5d8dc746cc16?auto=format&fit=crop&q=80&w=800',
];

export default function CarDetail() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [mileageLogs, setMileageLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addMileageOpen, setAddMileageOpen] = useState(false);
  const [completeTaskOpen, setCompleteTaskOpen] = useState(null);
  const [replacementOpen, setReplacementOpen] = useState(null);
  const [replacementReason, setReplacementReason] = useState('');
  const [editCarOpen, setEditCarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [newTask, setNewTask] = useState({
    task_type: '',
    description: '',
    last_performed_mileage: 0,
    interval_miles: 5000,
    interval_months: 6,
    notes: ''
  });

  const [newMileage, setNewMileage] = useState({
    mileage: 0,
    notes: ''
  });

  const [completeMileage, setCompleteMileage] = useState(0);
  const [editCar, setEditCar] = useState({});

  useEffect(() => {
    fetchCarData();
  }, [carId]);

  const fetchCarData = async () => {
    try {
      const [carRes, tasksRes, mileageRes] = await Promise.all([
        axios.get(`${API_URL}/cars/${carId}`),
        axios.get(`${API_URL}/maintenance?car_id=${carId}`),
        axios.get(`${API_URL}/mileage/${carId}`)
      ]);
      setCar(carRes.data);
      setTasks(tasksRes.data);
      setMileageLogs(mileageRes.data);
      setEditCar(carRes.data);
      setNewMileage({ mileage: carRes.data.current_mileage || 0, notes: '' });
    } catch (error) {
      toast.error('Failed to load car details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/maintenance`, {
        car_id: carId,
        ...newTask,
        last_performed_date: selectedDate.toISOString()
      });
      toast.success('Maintenance task added!');
      setAddTaskOpen(false);
      setNewTask({ task_type: '', description: '', last_performed_mileage: 0, interval_miles: 5000, interval_months: 6, notes: '' });
      fetchCarData();
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await axios.post(`${API_URL}/maintenance/${taskId}/complete?mileage=${completeMileage}`);
      toast.success('Maintenance completed!');
      setCompleteTaskOpen(null);
      fetchCarData();
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`${API_URL}/maintenance/${taskId}`);
      toast.success('Task deleted');
      fetchCarData();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleRequestReplacement = async (taskId) => {
    if (!replacementReason.trim()) {
      toast.error('Please provide a reason for replacement');
      return;
    }
    try {
      await axios.post(`${API_URL}/maintenance/${taskId}/request-replacement`, {
        reason: replacementReason
      });
      toast.success('Replacement requested!');
      setReplacementOpen(null);
      setReplacementReason('');
      fetchCarData();
    } catch (error) {
      toast.error('Failed to request replacement');
    }
  };

  const handleCancelReplacement = async (taskId) => {
    try {
      await axios.post(`${API_URL}/maintenance/${taskId}/cancel-replacement`);
      toast.success('Replacement request cancelled');
      fetchCarData();
    } catch (error) {
      toast.error('Failed to cancel replacement');
    }
  };

  const handleAddMileage = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/mileage`, {
        car_id: carId,
        mileage: newMileage.mileage,
        notes: newMileage.notes,
        date: selectedDate.toISOString()
      });
      toast.success('Mileage logged!');
      setAddMileageOpen(false);
      fetchCarData();
    } catch (error) {
      toast.error('Failed to log mileage');
    }
  };

  const handleUpdateCar = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/cars/${carId}`, editCar);
      toast.success('Car updated!');
      setEditCarOpen(false);
      fetchCarData();
    } catch (error) {
      toast.error('Failed to update car');
    }
  };

  const handleDeleteCar = async () => {
    if (!window.confirm('Are you sure you want to delete this vehicle? This will also delete all maintenance tasks.')) return;
    try {
      await axios.delete(`${API_URL}/cars/${carId}`);
      toast.success('Vehicle deleted');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to delete vehicle');
    }
  };

  const handleTaskTypeChange = (value) => {
    const taskType = maintenanceTypes.find(t => t.value === value);
    setNewTask({
      ...newTask,
      task_type: value,
      interval_miles: taskType?.defaultMiles || 5000,
      interval_months: taskType?.defaultMonths || 6
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!car) return null;

  const getStatusCounts = () => {
    const counts = { good: 0, due_soon: 0, overdue: 0, replacement_requested: 0 };
    tasks.forEach(t => {
      if (counts.hasOwnProperty(t.status)) {
        counts[t.status]++;
      } else {
        counts.good++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6 animate-fade-in" data-testid="car-detail">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} data-testid="back-button">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-outfit font-bold">{car.year} {car.make} {car.model}</h1>
          <p className="text-muted-foreground">{car.license_plate || 'No plate'} • {car.color || 'Unknown color'}</p>
        </div>
        <Dialog open={editCarOpen} onOpenChange={setEditCarOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" data-testid="edit-car-button">
              <Edit className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Vehicle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateCar} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Input value={editCar.make || ''} onChange={(e) => setEditCar({ ...editCar, make: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input value={editCar.model || ''} onChange={(e) => setEditCar({ ...editCar, model: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input type="number" value={editCar.year || ''} onChange={(e) => setEditCar({ ...editCar, year: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input value={editCar.color || ''} onChange={(e) => setEditCar({ ...editCar, color: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>License Plate</Label>
                <Input value={editCar.license_plate || ''} onChange={(e) => setEditCar({ ...editCar, license_plate: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
                <Button type="button" variant="destructive" onClick={handleDeleteCar} data-testid="delete-car-button">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Car Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 card-base">
          <CardContent className="p-0">
            <img
              src={car.image_url || carPlaceholders[0]}
              alt={`${car.make} ${car.model}`}
              className="w-full h-48 object-cover rounded-t-xl"
            />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                    <Gauge className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Mileage</p>
                    <p className="text-2xl font-outfit font-bold">{car.current_mileage?.toLocaleString() || 0} mi</p>
                  </div>
                </div>
                <Dialog open={addMileageOpen} onOpenChange={setAddMileageOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-600 hover:bg-indigo-700" data-testid="update-mileage-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Update Mileage
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log Mileage</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddMileage} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Current Mileage</Label>
                        <Input
                          type="number"
                          value={newMileage.mileage}
                          onChange={(e) => setNewMileage({ ...newMileage, mileage: parseInt(e.target.value) || 0 })}
                          data-testid="mileage-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarDays className="w-4 h-4 mr-2" />
                              {format(selectedDate, 'PPP')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Textarea
                          value={newMileage.notes}
                          onChange={(e) => setNewMileage({ ...newMileage, notes: e.target.value })}
                          placeholder="e.g., Trip to LA"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                        Log Mileage
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-base">
          <CardHeader>
            <CardTitle className="text-lg font-outfit">Health Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium">Good</span>
              </div>
              <span className="text-xl font-bold text-emerald-600">{statusCounts.good}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium">Due Soon</span>
              </div>
              <span className="text-xl font-bold text-amber-600">{statusCounts.due_soon}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium">Overdue</span>
              </div>
              <span className="text-xl font-bold text-red-600">{statusCounts.overdue}</span>
            </div>
            {statusCounts.replacement_requested > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">Needs Replacement</span>
                </div>
                <span className="text-xl font-bold text-purple-600">{statusCounts.replacement_requested}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="maintenance" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <TabsTrigger value="maintenance" className="rounded-md" data-testid="tab-maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="mileage" className="rounded-md" data-testid="tab-mileage">Mileage History</TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-outfit font-semibold">Maintenance Tasks</h2>
            <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700" data-testid="add-task-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Maintenance Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddTask} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Task Type</Label>
                    <Select value={newTask.task_type} onValueChange={handleTaskTypeChange}>
                      <SelectTrigger data-testid="task-type-select">
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                      <SelectContent>
                        {maintenanceTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Performed At (Miles)</Label>
                    <Input
                      type="number"
                      value={newTask.last_performed_mileage}
                      onChange={(e) => setNewTask({ ...newTask, last_performed_mileage: parseInt(e.target.value) || 0 })}
                      data-testid="task-mileage-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Performed Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarDays className="w-4 h-4 mr-2" />
                          {format(selectedDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Interval (Miles)</Label>
                      <Input
                        type="number"
                        value={newTask.interval_miles}
                        onChange={(e) => setNewTask({ ...newTask, interval_miles: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Interval (Months)</Label>
                      <Input
                        type="number"
                        value={newTask.interval_months}
                        onChange={(e) => setNewTask({ ...newTask, interval_months: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={newTask.notes}
                      onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" data-testid="submit-task-button">
                    Add Task
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {tasks.length === 0 ? (
            <Card className="card-base">
              <CardContent className="py-12 text-center">
                <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No maintenance tasks yet</p>
                <Button variant="link" className="text-indigo-600 mt-2" onClick={() => setAddTaskOpen(true)}>
                  Add your first task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map(task => {
                const taskType = maintenanceTypes.find(t => t.value === task.task_type);
                const IconComponent = taskType?.icon || Wrench;
                const isReplacementRequested = task.status === 'replacement_requested' || task.replacement_requested;
                return (
                  <Card key={task.id} className={`card-base ${isReplacementRequested ? 'border-purple-500 dark:border-purple-400' : ''}`} data-testid={`maintenance-task-${task.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isReplacementRequested ? 'bg-purple-100 dark:bg-purple-900/20' :
                          task.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/20' :
                          task.status === 'due_soon' ? 'bg-amber-100 dark:bg-amber-900/20' :
                          'bg-emerald-100 dark:bg-emerald-900/20'
                        }`}>
                          <IconComponent className={`w-6 h-6 ${
                            isReplacementRequested ? 'text-purple-600' :
                            task.status === 'overdue' ? 'text-red-600' :
                            task.status === 'due_soon' ? 'text-amber-600' :
                            'text-emerald-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium capitalize">{task.task_type.replace(/_/g, ' ')}</h3>
                            <Badge className={
                              isReplacementRequested ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                              task.status === 'overdue' ? 'status-overdue' :
                              task.status === 'due_soon' ? 'status-due-soon' :
                              'status-good'
                            }>
                              {isReplacementRequested ? 'Needs Replacement' : 
                               task.status === 'overdue' ? 'Overdue' : 
                               task.status === 'due_soon' ? 'Due Soon' : 'Good'}
                            </Badge>
                          </div>
                          
                          {/* Show replacement reason if requested */}
                          {isReplacementRequested && task.replacement_reason && (
                            <div className="mt-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
                              <p className="text-sm text-purple-700 dark:text-purple-300">
                                <strong>Reason:</strong> {task.replacement_reason}
                              </p>
                            </div>
                          )}
                          
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <p>Last: {task.last_performed_mileage?.toLocaleString() || 'N/A'} mi</p>
                            <p>Next: {task.next_due_mileage?.toLocaleString() || 'N/A'} mi</p>
                            <p>Every {task.interval_miles?.toLocaleString()} mi / {task.interval_months} months</p>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Dialog open={completeTaskOpen === task.id} onOpenChange={(open) => setCompleteTaskOpen(open ? task.id : null)}>
                              <DialogTrigger asChild>
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" data-testid={`complete-task-${task.id}`}>
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Complete
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Complete Maintenance</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                  <p>Mark <strong className="capitalize">{task.task_type.replace(/_/g, ' ')}</strong> as complete?</p>
                                  <div className="space-y-2">
                                    <Label>Current Mileage</Label>
                                    <Input
                                      type="number"
                                      value={completeMileage}
                                      onChange={(e) => setCompleteMileage(parseInt(e.target.value) || 0)}
                                      placeholder={car.current_mileage?.toString()}
                                    />
                                  </div>
                                  <Button onClick={() => handleCompleteTask(task.id)} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    Mark Complete
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteTask(task.id)} data-testid={`delete-task-${task.id}`}>
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mileage">
          <Card className="card-base">
            <CardHeader>
              <CardTitle className="text-lg font-outfit">Mileage History</CardTitle>
            </CardHeader>
            <CardContent>
              {mileageLogs.length === 0 ? (
                <div className="py-8 text-center">
                  <Gauge className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No mileage logs yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mileageLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div>
                        <p className="font-medium">{log.mileage.toLocaleString()} miles</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(log.date), 'PPP')}
                          {log.notes && ` • ${log.notes}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
