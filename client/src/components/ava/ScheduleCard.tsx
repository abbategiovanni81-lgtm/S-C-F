import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Clock } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface ScheduleCardProps {
  onSchedule?: (date: Date, time: string) => void;
  onAddToQueue?: () => void;
}

export function ScheduleCard({ onSchedule, onAddToQueue }: ScheduleCardProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("12:00");

  const handleSchedule = () => {
    if (date && time && onSchedule) {
      const [hours, minutes] = time.split(":");
      const scheduledDate = new Date(date);
      scheduledDate.setHours(parseInt(hours), parseInt(minutes));
      onSchedule(scheduledDate, time);
    }
  };

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return [
      `${hour}:00`,
      `${hour}:30`
    ];
  }).flat();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Schedule Your Post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Select Time</Label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger className="w-full">
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {timeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button 
            onClick={handleSchedule}
            disabled={!date}
            className="w-full"
          >
            Schedule Post
          </Button>
          <Button 
            onClick={onAddToQueue}
            variant="outline"
            className="w-full"
          >
            Add to Content Queue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
