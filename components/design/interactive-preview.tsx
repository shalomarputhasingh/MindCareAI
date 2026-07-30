"use client";

import { Check, ChevronsUpDown, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Stand-in for the model list the setup wizard will fetch from a provider. */
const SAMPLE_MODELS = [
  "anthropic/claude-sonnet-4",
  "google/gemini-2.5-flash",
  "meta-llama/llama-3.3-70b",
  "openai/gpt-4.1-mini",
];

export function InteractivePreview() {
  const [temperature, setTemperature] = useState([0.7]);
  const [notifications, setNotifications] = useState(true);
  const [model, setModel] = useState(SAMPLE_MODELS[0]);
  const [modelOpen, setModelOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ------------------------------ Form controls ----------------------- */}
      <div className="surface space-y-5 p-6">
        <p className="type-eyebrow">Form controls</p>

        <div className="space-y-2">
          <Label htmlFor="preview-key">API key</Label>
          <Input id="preview-key" type="password" placeholder="sk-or-v1-…" />
          <p className="type-caption text-xs">Stored in this browser only.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preview-journal">Journal entry</Label>
          <Textarea
            id="preview-journal"
            rows={3}
            placeholder="What's on your mind today?"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preview-provider">Provider</Label>
          <Select defaultValue="openrouter">
            <SelectTrigger id="preview-provider" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openrouter">OpenRouter</SelectItem>
              <SelectItem value="groq">Groq</SelectItem>
              <SelectItem value="gemini">Google Gemini</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview of the searchable model picker the setup wizard needs. */}
        <div className="space-y-2">
          <Label htmlFor="preview-model">Model</Label>
          <Popover open={modelOpen} onOpenChange={setModelOpen}>
            <PopoverTrigger asChild>
              <Button
                id="preview-model"
                variant="outline"
                role="combobox"
                aria-expanded={modelOpen}
                className="w-full justify-between font-normal"
              >
                <span className="truncate">{model}</span>
                <ChevronsUpDown className="size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
              <Command>
                <CommandInput placeholder="Search models…" />
                <CommandList>
                  <CommandEmpty>No model matches that search.</CommandEmpty>
                  <CommandGroup>
                    {SAMPLE_MODELS.map((id) => (
                      <CommandItem
                        key={id}
                        value={id}
                        onSelect={(value) => {
                          setModel(value);
                          setModelOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "size-4",
                            model === id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">{id}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="preview-temperature">Temperature</Label>
            <span className="tabular type-caption text-xs">
              {temperature[0].toFixed(1)}
            </span>
          </div>
          <Slider
            id="preview-temperature"
            min={0}
            max={2}
            step={0.1}
            value={temperature}
            onValueChange={setTemperature}
          />
        </div>

        <div className="border-border flex items-center justify-between rounded-lg border p-3.5">
          <div className="space-y-0.5 pr-4">
            <Label htmlFor="preview-notifications">Reminders</Label>
            <p className="type-caption text-xs">
              Gentle nudges for water, journalling and sleep.
            </p>
          </div>
          <Switch
            id="preview-notifications"
            checked={notifications}
            onCheckedChange={setNotifications}
          />
        </div>
      </div>

      {/* ------------------------------- Feedback --------------------------- */}
      <div className="space-y-6">
        <div className="surface space-y-5 p-6">
          <p className="type-eyebrow">Feedback</p>

          <div className="flex flex-wrap items-center gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="bg-brand text-brand-foreground border-transparent">
              Streak
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="type-caption text-xs">Habits today</span>
              <span className="tabular type-caption text-xs">3 of 5</span>
            </div>
            <Progress value={60} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Journal saved", { description: "142 words." })}
            >
              Show toast
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  Hover me
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tooltips carry hints, never critical text.</TooltipContent>
            </Tooltip>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Open dialog
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear this conversation?</DialogTitle>
                  <DialogDescription>
                    The messages are deleted from this device. Your journal, moods and
                    habits stay as they are.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost">Keep it</Button>
                  <Button variant="destructive">Clear conversation</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="surface space-y-4 p-6">
          <p className="type-eyebrow">Tabs &amp; calendar</p>
          <Tabs defaultValue="week">
            <TabsList>
              <TabsTrigger value="week">This week</TabsTrigger>
              <TabsTrigger value="month">This month</TabsTrigger>
            </TabsList>
            <TabsContent value="week" className="type-caption pt-3">
              Seven days of mood check-ins appear here.
            </TabsContent>
            <TabsContent value="month" className="type-caption pt-3">
              A month at a glance, one square per day.
            </TabsContent>
          </Tabs>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-lg border p-3"
          />
        </div>
      </div>

      {/* -------------------------- Signature: breath ----------------------- */}
      <div className="surface relative overflow-hidden p-6 lg:col-span-2">
        <div
          aria-hidden
          className="aurora animate-breathe pointer-events-none absolute inset-0 origin-center"
        />
        <div className="relative space-y-2">
          <p className="type-eyebrow">Signature</p>
          <h3 className="type-title flex items-center gap-2">
            <Sparkles className="text-brand-strong size-5" aria-hidden />
            The breathing aurora
          </h3>
          <p className="type-caption max-w-prose text-pretty">
            The indigo-to-teal wash behind hero and header areas expands and settles on a
            19-second cycle — a 4-7-8 breath, slowed down. It sets the pace of the whole
            product, and it holds still for anyone who prefers reduced motion.
          </p>
        </div>
      </div>
    </div>
  );
}
