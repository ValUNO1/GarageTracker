import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Wrench, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  MapPin,
  Car
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const quickPrompts = [
  "My car is making a strange noise",
  "When should I change my oil?",
  "How to check brake pads?",
  "My engine light is on",
  "Car won't start, what should I check?"
];

export default function AIMechanic() {
  const [cars, setCars] = useState([]);
  const [selectedCarId, setSelectedCarId] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm AutoBot, your AI mechanic assistant. I can help you with:\n\n• Diagnosing car problems\n• Maintenance schedules and tips\n• Step-by-step repair guidance\n• Finding nearby mechanics\n\nSelect a vehicle for personalized advice, or just ask me anything about car maintenance!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCars = async () => {
    try {
      const response = await axios.get(`${API_URL}/cars`);
      setCars(response.data);
    } catch (error) {
      console.error('Failed to fetch cars');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: userMessage,
        car_id: selectedCarId || null
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response,
        suggestions: response.data.suggestions
      }]);
    } catch (error) {
      toast.error('Failed to get response');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="ai-mechanic-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-outfit font-bold text-foreground">AI Mechanic</h1>
          <p className="text-muted-foreground mt-1">Get instant help with car maintenance and repairs</p>
        </div>
        <Link to="/nearby-mechanics">
          <Button variant="outline" className="rounded-full" data-testid="find-mechanics-button">
            <MapPin className="w-4 h-4 mr-2" />
            Find Nearby Mechanics
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="card-base">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Select Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCarId || "none"} onValueChange={(v) => setSelectedCarId(v === "none" ? "" : v)}>
                <SelectTrigger data-testid="car-select">
                  <SelectValue placeholder="Choose a car (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific car</SelectItem>
                  {cars.map(car => (
                    <SelectItem key={car.id} value={car.id}>
                      {car.year} {car.make} {car.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCarId && (
                <p className="text-xs text-muted-foreground mt-2">
                  AutoBot will use your car's details for personalized advice
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="card-base">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Quick Prompts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3 text-sm"
                  onClick={() => handleQuickPrompt(prompt)}
                  data-testid={`quick-prompt-${index}`}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-2 text-indigo-500 flex-shrink-0" />
                  <span className="truncate">{prompt}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <Card className="lg:col-span-3 card-base flex flex-col h-[600px]">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-outfit">AutoBot</CardTitle>
                <p className="text-xs text-muted-foreground">Your AI mechanic assistant</p>
              </div>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  data-testid={`message-${index}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-indigo-600'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Wrench className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-foreground'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.suggestions.map((suggestion, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 rounded-full"
                            onClick={() => handleQuickPrompt(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-indigo-600 animate-spin" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-slate-100 dark:bg-slate-800">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about car maintenance..."
                className="flex-1"
                disabled={loading}
                data-testid="chat-input"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-6"
                data-testid="send-button"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
