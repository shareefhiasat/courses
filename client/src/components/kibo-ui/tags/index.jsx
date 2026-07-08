"use client";;
import { XIcon } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/kibo/ui/badge";
import { Button } from "@/components/kibo/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/kibo/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/kibo/ui/popover";
import { cn } from "@/lib/utils";

const TagsContext = createContext({
  value: undefined,
  setValue: undefined,
  open: false,
  onOpenChange: () => {},
  width: undefined,
  setWidth: undefined,
});

const useTagsContext = () => {
  const context = useContext(TagsContext);

  if (!context) {
    throw new Error("useTagsContext must be used within a TagsProvider");
  }

  return context;
};

export const Tags = ({
  value,
  setValue,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  children,
  className
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [width, setWidth] = useState();
  const ref = useRef(null);

  const open = controlledOpen ?? uncontrolledOpen;
  const onOpenChange = controlledOnOpenChange ?? setUncontrolledOpen;

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });

    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <TagsContext.Provider value={{ value, setValue, open, onOpenChange, width, setWidth }}>
      <Popover onOpenChange={onOpenChange} open={open}>
        <div className={cn("relative w-full", className)} ref={ref}>
          {children}
        </div>
      </Popover>
    </TagsContext.Provider>
  );
};

export const TagsTrigger = ({
  className,
  children,
  ...props
}) => (
  <PopoverTrigger asChild>
    <Button
      className={cn("h-auto w-full justify-between p-2", className)}
      // biome-ignore lint/a11y/useSemanticElements: "Required"
      role="combobox"
      variant="outline"
      {...props}>
      <div className="flex flex-wrap items-center gap-1">
        {children}
        <span className="px-2 py-px text-muted-foreground">
          Select a tag...
        </span>
      </div>
    </Button>
  </PopoverTrigger>
);

export const TagsValue = ({
  className,
  children,
  onRemove,
  ...props
}) => {
  const handleRemove = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onRemove?.();
  };

  return (
    <Badge className={cn("flex items-center gap-2", className)} {...props}>
      {children}
      {onRemove && (
        // biome-ignore lint/a11y/noStaticElementInteractions: "This is a clickable badge"
        // biome-ignore lint/a11y/useKeyWithClickEvents: "This is a clickable badge"
        (<div
          className="size-auto cursor-pointer hover:text-muted-foreground"
          onClick={handleRemove}>
          <XIcon size={12} />
        </div>)
      )}
    </Badge>
  );
};

export const TagsContent = ({
  className,
  children,
  ...props
}) => {
  const { width } = useTagsContext();

  return (
    <PopoverContent className={cn("p-0", className)} style={{ width }} {...props}>
      <Command>{children}</Command>
    </PopoverContent>
  );
};

export const TagsInput = ({
  className,
  ...props
}) => (
  <CommandInput className={cn("h-9", className)} {...props} />
);

export const TagsList = ({
  className,
  ...props
}) => (
  <CommandList className={cn("max-h-[200px]", className)} {...props} />
);

export const TagsEmpty = ({
  children,
  className,
  ...props
}) => (
  <CommandEmpty {...props}>{children ?? "No tags found."}</CommandEmpty>
);

export const TagsGroup = CommandGroup;

export const TagsItem = ({
  className,
  ...props
}) => (
  <CommandItem
    className={cn("cursor-pointer items-center justify-between", className)}
    {...props} />
);
