"use client";

import { CircleNotchIcon, TrashIcon } from "@phosphor-icons/react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type CatalogMutationDialogProps = {
  description: string;
  name: string;
  nameLabel: string;
  open: boolean;
  partCode?: string;
  pending: boolean;
  submitLabel: string;
  title: string;
  onNameChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onPartCodeChange?: (value: string) => void;
  onSubmit: () => void;
};

export function CatalogMutationDialog({
  description,
  name,
  nameLabel,
  open,
  partCode,
  pending,
  submitLabel,
  title,
  onNameChange,
  onOpenChange,
  onPartCodeChange,
  onSubmit,
}: CatalogMutationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="catalog-dialog-name">{nameLabel}</FieldLabel>
              <Input
                autoFocus
                id="catalog-dialog-name"
                maxLength={200}
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
              />
            </Field>
            {onPartCodeChange ? (
              <Field>
                <FieldLabel htmlFor="catalog-dialog-part-code">
                  Part code
                </FieldLabel>
                <Input
                  id="catalog-dialog-part-code"
                  maxLength={120}
                  value={partCode ?? ""}
                  onChange={(event) => onPartCodeChange(event.target.value)}
                />
              </Field>
            ) : null}
          </FieldGroup>

          <DialogFooter>
            <Button
              disabled={pending}
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                pending ||
                !name.trim() ||
                (onPartCodeChange ? !(partCode ?? "").trim() : false)
              }
              type="submit"
            >
              {pending ? <CircleNotchIcon className="animate-spin" /> : null}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type CatalogDeleteDialogProps = {
  description: string;
  name: string;
  open: boolean;
  pending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function CatalogDeleteDialog({
  description,
  name,
  open,
  pending,
  onConfirm,
  onOpenChange,
}: CatalogDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TrashIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete “{name}”?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            type="button"
            variant="destructive"
            onClick={onConfirm}
          >
            {pending ? <CircleNotchIcon className="animate-spin" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
