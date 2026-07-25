import { cn } from "@/lib/utils";
import { Platform, TextInput } from "react-native";

function Input({
  className,
  ...props
}: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        "border-gray-700 bg-background font-sans h-10 text-text-primary flex min-w-0 flex-row items-center rounded-md border p-2 text-base leading-none placeholder:text-neutral-700",
        props.editable === false &&
          cn(
            "opacity-50",
            Platform.select({
              web: "disabled:pointer-events-none disabled:cursor-not-allowed",
            }),
          ),
        Platform.select({
          web: cn(
            "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          ),
          native: "placeholder:text-text-primary/50",
        }),
        className,
      )}
      {...props}
    />
  );
}

export { Input };
