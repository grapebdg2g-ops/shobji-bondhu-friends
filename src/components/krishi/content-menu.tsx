import { useState } from "react";
import { MoreVertical, Flag, BellOff, Trash2, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReportModal, type ReportContentType } from "./report-modal";
import { useUser } from "@/contexts/user-context";
import { useMuteMutation } from "@/hooks/use-muted-users";

export function ContentMenu({
  contentType,
  contentId,
  authorId,
  authorName,
  onEdit,
  onDelete,
  className,
}: {
  contentType: ReportContentType;
  contentId?: string | null;
  authorId: string | null | undefined;
  authorName?: string | null;
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
  className?: string;
}) {
  const { user } = useUser();
  const { mute } = useMuteMutation();
  const [reportO