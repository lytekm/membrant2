import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  BookOpen,
  Heartbeat,
  Briefcase,
  Plant,
  Wallet,
  ArrowRight,
} from '@phosphor-icons/react';
import { cloneElement, isValidElement, useId, type ReactNode, type ReactElement } from 'react';
import type { Goal, GoalTemplate } from '@membrant/core';

export type GoalActions = {
  onCreate(template?: GoalTemplate): void;
  onOpen(goal: Goal): void;
  onLog(goal: Goal): void;
};
export function CategoryIcon({
  category,
  size = 22,
}: {
  category: Goal['category'];
  size?: number;
}) {
  const Icon = {
    Health: Heartbeat,
    Learning: BookOpen,
    Career: Briefcase,
    Personal: Plant,
    Finance: Wallet,
  }[category];
  return <Icon size={size} weight="duotone" aria-hidden="true" />;
}

export function Modal({
  title,
  description,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose(): void;
  wide?: boolean;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className={`modal ${wide ? 'modal-wide' : ''}`}>
          <div className="modal-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description className={description ? 'muted' : 'sr-only'}>
                {description ?? 'Manage your Membrant workspace.'}
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close dialog">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ProgressBar({ value, label = 'Goal progress' }: { value: number; label?: string }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div style={{ width: `${value}%` }} />
    </div>
  );
}
export function EmptyState({
  title,
  text,
  action,
  label = 'Create a goal',
}: {
  title: string;
  text: string;
  action?: () => void;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-thread" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{text}</p>
      {action && (
        <button className="button primary" onClick={action}>
          {label}
          <ArrowRight size={17} />
        </button>
      )}
    </div>
  );
}
export function CoachNote({
  title,
  children,
  attention = false,
}: {
  title: string;
  children: ReactNode;
  attention?: boolean;
}) {
  return (
    <div className={`coach-note ${attention ? 'attention' : ''}`}>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  const input = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{ 'aria-labelledby'?: string; 'aria-describedby'?: string }>,
        { 'aria-labelledby': `${id}-label`, 'aria-describedby': hint ? `${id}-hint` : undefined },
      )
    : children;
  return (
    <label className="field">
      <span id={`${id}-label`}>{label}</span>
      {input}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </label>
  );
}
export function ErrorMessage({ error }: { error: string | null }) {
  return error ? (
    <div className="form-error" role="alert">
      {error}
    </div>
  ) : null;
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}
