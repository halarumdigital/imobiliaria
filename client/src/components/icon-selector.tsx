import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as Icons from 'lucide-react';

interface IconSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Lista de ícones comuns para comodidades imobiliárias com seus nomes corretos
const iconList = [
  { name: 'Sofa', icon: Icons.Sofa },
  { name: 'Bed', icon: Icons.Bed },
  { name: 'Bath', icon: Icons.Bath },
  { name: 'Car', icon: Icons.Car },
  { name: 'Trees', icon: Icons.Trees },
  { name: 'Waves', icon: Icons.Waves },
  { name: 'Sun', icon: Icons.Sun },
  { name: 'Coffee', icon: Icons.Coffee },
  { name: 'Wifi', icon: Icons.Wifi },
  { name: 'Tv', icon: Icons.Tv },
  { name: 'AirVent', icon: Icons.AirVent },
  { name: 'Snowflake', icon: Icons.Snowflake },
  { name: 'Flame', icon: Icons.Flame },
  { name: 'Utensils', icon: Icons.Utensils },
  { name: 'Dumbbell', icon: Icons.Dumbbell },
  { name: 'Users', icon: Icons.Users },
  { name: 'Baby', icon: Icons.Baby },
  { name: 'Dog', icon: Icons.Dog },
  { name: 'Cat', icon: Icons.Cat },
  { name: 'Shield', icon: Icons.Shield },
  { name: 'Camera', icon: Icons.Camera },
  { name: 'Lock', icon: Icons.Lock },
  { name: 'Key', icon: Icons.Key },
  { name: 'Phone', icon: Icons.Phone },
  { name: 'MapPin', icon: Icons.MapPin },
  { name: 'Home', icon: Icons.Home },
  { name: 'Building', icon: Icons.Building },
  { name: 'Building2', icon: Icons.Building2 },
  { name: 'TreePine', icon: Icons.TreePine },
  { name: 'Flower', icon: Icons.Flower },
  { name: 'Mountain', icon: Icons.Mountain },
  { name: 'Umbrella', icon: Icons.Umbrella },
  { name: 'Zap', icon: Icons.Zap },
  { name: 'Droplet', icon: Icons.Droplet },
  { name: 'Wind', icon: Icons.Wind },
  { name: 'Thermometer', icon: Icons.Thermometer },
  { name: 'Music', icon: Icons.Music },
  { name: 'Volume2', icon: Icons.Volume2 },
  { name: 'Gamepad2', icon: Icons.Gamepad2 },
  { name: 'Book', icon: Icons.Book },
  { name: 'GraduationCap', icon: Icons.GraduationCap },
  { name: 'ShoppingBag', icon: Icons.ShoppingBag },
  { name: 'ShoppingCart', icon: Icons.ShoppingCart },
  { name: 'Package', icon: Icons.Package },
  { name: 'Briefcase', icon: Icons.Briefcase },
  { name: 'Calendar', icon: Icons.Calendar },
  { name: 'Clock', icon: Icons.Clock },
  { name: 'Timer', icon: Icons.Timer },
  { name: 'Trash2', icon: Icons.Trash2 },
  { name: 'Recycle', icon: Icons.Recycle },
  { name: 'ParkingCircle', icon: Icons.ParkingCircle },
  { name: 'Bike', icon: Icons.Bike },
  { name: 'Train', icon: Icons.Train },
  { name: 'Bus', icon: Icons.Bus },
  { name: 'Plane', icon: Icons.Plane },
  { name: 'Ship', icon: Icons.Ship },
  { name: 'Anchor', icon: Icons.Anchor },
  { name: 'Compass', icon: Icons.Compass },
  { name: 'Map', icon: Icons.Map },
  { name: 'Navigation', icon: Icons.Navigation },
  { name: 'Heart', icon: Icons.Heart },
  { name: 'Star', icon: Icons.Star },
  { name: 'Award', icon: Icons.Award },
  { name: 'Trophy', icon: Icons.Trophy },
  { name: 'Medal', icon: Icons.Medal },
  { name: 'Crown', icon: Icons.Crown },
  { name: 'Gem', icon: Icons.Gem },
  { name: 'Gift', icon: Icons.Gift },
  { name: 'Cake', icon: Icons.Cake },
  { name: 'PartyPopper', icon: Icons.PartyPopper },
  { name: 'Sparkles', icon: Icons.Sparkles },
  { name: 'Palette', icon: Icons.Palette },
  { name: 'Brush', icon: Icons.Brush },
  { name: 'PaintBucket', icon: Icons.PaintBucket },
  { name: 'Ruler', icon: Icons.Ruler },
  { name: 'Hammer', icon: Icons.Hammer },
  { name: 'Wrench', icon: Icons.Wrench },
  { name: 'HardHat', icon: Icons.HardHat },
  { name: 'Lightbulb', icon: Icons.Lightbulb },
  { name: 'Lamp', icon: Icons.Lamp },
  { name: 'Flashlight', icon: Icons.Flashlight },
  { name: 'Sunrise', icon: Icons.Sunrise },
  { name: 'Sunset', icon: Icons.Sunset },
  { name: 'Moon', icon: Icons.Moon },
  { name: 'Cloud', icon: Icons.Cloud },
  { name: 'CloudRain', icon: Icons.CloudRain },
  { name: 'CloudSnow', icon: Icons.CloudSnow },
  { name: 'Fish', icon: Icons.Fish },
  { name: 'Flower2', icon: Icons.Flower2 },
  { name: 'Cherry', icon: Icons.Cherry },
  { name: 'Apple', icon: Icons.Apple },
  { name: 'Pizza', icon: Icons.Pizza },
  { name: 'Sandwich', icon: Icons.Sandwich },
  { name: 'Soup', icon: Icons.Soup },
  { name: 'Cookie', icon: Icons.Cookie },
  { name: 'Milk', icon: Icons.Milk },
  { name: 'Beer', icon: Icons.Beer },
  { name: 'Wine', icon: Icons.Wine },
  { name: 'Martini', icon: Icons.Martini },
  { name: 'CupSoda', icon: Icons.CupSoda },
  { name: 'Pill', icon: Icons.Pill },
  { name: 'Stethoscope', icon: Icons.Stethoscope },
  { name: 'Activity', icon: Icons.Activity },
  { name: 'Accessibility', icon: Icons.Accessibility },
  { name: 'Archive', icon: Icons.Archive },
  { name: 'Inbox', icon: Icons.Inbox },
  { name: 'Send', icon: Icons.Send },
  { name: 'CheckCircle', icon: Icons.CheckCircle },
  { name: 'XCircle', icon: Icons.XCircle },
  { name: 'AlertCircle', icon: Icons.AlertCircle },
  { name: 'Info', icon: Icons.Info },
  { name: 'HelpCircle', icon: Icons.HelpCircle }
];

export function IconSelector({ value, onChange, placeholder = 'Selecione um ícone' }: IconSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search) return iconList;
    return iconList.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const getIconComponent = (iconName: string) => {
    const iconItem = iconList.find(item => item.name === iconName);
    if (iconItem) {
      const Icon = iconItem.icon;
      return <Icon className="w-5 h-5" />;
    }
    return null;
  };

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setOpen(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {value ? (
            <div className="flex items-center gap-2">
              {getIconComponent(value)}
              <span>{value}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Selecionar Ícone</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Pesquisar ícone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />

          <ScrollArea className="h-[400px] w-full pr-4">
            <div className="grid grid-cols-6 gap-2">
              {filteredIcons.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    variant={value === item.name ? "default" : "outline"}
                    className="h-20 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform"
                    onClick={() => handleSelect(item.name)}
                  >
                    <div className="text-2xl">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-center break-all">
                      {item.name}
                    </span>
                  </Button>
                );
              })}
            </div>

            {filteredIcons.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nenhum ícone encontrado
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}