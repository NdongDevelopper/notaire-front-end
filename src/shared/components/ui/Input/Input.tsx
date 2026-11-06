import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

type BaseProps = {
  label?: string;
  helperText?: string;
  error?: string;
};

export interface InputProps
  extends BaseProps,
    InputHTMLAttributes<HTMLInputElement> {
  as?: 'input';
}

export interface TextareaProps
  extends BaseProps,
    TextareaHTMLAttributes<HTMLTextAreaElement> {
  as: 'textarea';
}

type Props = InputProps | TextareaProps;

// Changement : Fond gris clair, suppression de la bordure brute, et ajout de transitions animées
const fieldStyles =
  'w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] disabled:opacity-60 disabled:cursor-not-allowed';

// Changement : Focus de l'erreur avec opacité sur l'anneau pour un effet plus doux
const errorStyles =
  'border-[var(--color-danger)] bg-red-50/30 focus:bg-white focus:ring-[var(--color-danger)]/20 focus:border-[var(--color-danger)]';

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  (
    {
      label,
      helperText,
      error,
      id,
      as = 'input',
      className,
      ...props
    },
    ref
  ) => {
    const fieldId = id ?? props.name;

    const classes = `${fieldStyles} ${
      error ? errorStyles : ''
    } ${className ?? ''}`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={fieldId}
            className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
          >
            {label}
          </label>
        )}

        {as === 'textarea' ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={fieldId}
            className={`${classes} resize-y min-h-[80px]`}
            {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={fieldId}
            className={classes}
            {...(props as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}

        {error ? (
          <span className="text-xs font-medium text-[var(--color-danger)]">{error}</span>
        ) : helperText ? (
          <span className="text-xs italic text-[var(--color-text-muted)]">
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
