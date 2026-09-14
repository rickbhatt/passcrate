import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Text } from "react-native";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: ButtonProps["variant"];
};

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "default",
}: ConfirmDialogProps) => {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface">
        <DialogHeader>
          <DialogTitle className="h2-bold">{title}</DialogTitle>
          <DialogDescription className="base-paragraph">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row">
          <Button
            variant="outline"
            onPress={handleCancel}
            className="flex-1"
          >
            <Text className="btn-label-dark">{cancelText}</Text>
          </Button>
          <Button
            variant={confirmVariant}
            onPress={onConfirm}
            className="flex-1"
          >
            <Text className="btn-label-white">{confirmText}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
