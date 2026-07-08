"use client";;
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { addDays, format, isSameDay, isToday } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Slot } from "radix-ui";
import { createContext, useContext } from "react";
import { Button } from "@/components/kibo/ui/button";
import { cn } from "@/lib/utils";

const MiniCalendarContext = createContext(null);

const useMiniCalendar = () => {
  const context = useContext(MiniCalendarContext);

  if (!context) {
    throw new Error("MiniCalendar components must be used within MiniCalendar");
  }

  return context;
};

// Helper function to get array of consecutive dates
const getDays = (startDate, count) => {
  const days = [];
  for (let i = 0; i < count; i++) {
    days.push(addDays(startDate, i));
  }
  return days;
};

// Helper function to format date
const formatDate = (date) => {
  const month = format(date, "MMM");
  const day = format(date, "d");

  return { month, day };
};

export const MiniCalendar = ({
  value,
  defaultValue,
  onValueChange,
  startDate,
  defaultStartDate = new Date(),
  onStartDateChange,
  days = 5,
  className,
  children,
  ...props
}) => {
  const [selectedDate, setSelectedDate] = useControllableState({
    prop: value,
    defaultProp: defaultValue,
    onChange: onValueChange,
  });

  const [currentStartDate, setCurrentStartDate] = useControllableState({
    prop: startDate,
    defaultProp: defaultStartDate,
    onChange: onStartDateChange,
  });

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleNavigate = (direction) => {
    const newStartDate = addDays(currentStartDate || new Date(), direction === "next" ? days : -days);
    setCurrentStartDate(newStartDate);
  };

  const contextValue = {
    selectedDate: selectedDate || null,
    onDateSelect: handleDateSelect,
    startDate: currentStartDate || new Date(),
    onNavigate: handleNavigate,
    days,
  };

  return (
    <MiniCalendarContext.Provider value={contextValue}>
      <div
        className={cn("flex items-center gap-2 rounded-lg border bg-background p-2", className)}
        {...props}>
        {children}
      </div>
    </MiniCalendarContext.Provider>
  );
};

export const MiniCalendarNavigation = ({
  direction,
  asChild = false,
  children,
  onClick,
  ...props
}) => {
  const { onNavigate } = useMiniCalendar();
  const Icon = direction === "prev" ? ChevronLeftIcon : ChevronRightIcon;

  const handleClick = (event) => {
    onNavigate(direction);
    onClick?.(event);
  };

  if (asChild) {
    return (
      <Slot.Root onClick={handleClick} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <Button
      onClick={handleClick}
      size={asChild ? undefined : "icon"}
      type="button"
      variant={asChild ? undefined : "ghost"}
      {...props}>
      {children ?? <Icon className="size-4" />}
    </Button>
  );
};

export const MiniCalendarDays = ({
  className,
  children,
  ...props
}) => {
  const { startDate, days: dayCount } = useMiniCalendar();
  const days = getDays(startDate, dayCount);

  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      {days.map((date) => children(date))}
    </div>
  );
};

export const MiniCalendarDay = ({
  date,
  className,
  ...props
}) => {
  const { selectedDate, onDateSelect } = useMiniCalendar();
  const { month, day } = formatDate(date);
  const isSelected = selectedDate && isSameDay(date, selectedDate);
  const isTodayDate = isToday(date);

  return (
    <Button
      className={cn(
        "h-auto min-w-[3rem] flex-col gap-0 p-2 text-xs",
        isTodayDate && !isSelected && "bg-accent",
        className
      )}
      onClick={() => onDateSelect(date)}
      size="sm"
      type="button"
      variant={isSelected ? "default" : "ghost"}
      {...props}>
      <span
        className={cn(
          "font-medium text-[10px] text-muted-foreground",
          isSelected && "text-primary-foreground/70"
        )}>
        {month}
      </span>
      <span className="font-semibold text-sm">{day}</span>
    </Button>
  );
};
