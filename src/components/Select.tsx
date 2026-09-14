"use client";

import { useEffect, useId, useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  className?: string;
  "aria-label"?: string;
};

export function Select({
  name,
  value: controlledValue,
  defaultValue = "",
  options,
  onChange,
  className = "",
  "aria-label": ariaLabel,
}: SelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlledValue ?? uncontrolled;
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function choose(next: string) {
    if (controlledValue === undefined) setUncontrolled(next);
    onChange?.(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`select ${className}`.trim()}>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={value}
          readOnly
          // Keep React from freezing the value for native form submits.
          onChange={() => undefined}
        />
      ) : null}
      <button
        type="button"
        className="select-trigger field"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{selected?.label ?? ""}</span>
        <span className="select-chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul id={listId} className="select-menu" role="listbox">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`select-option${active ? " is-active" : ""}`}
                  onClick={() => choose(option.value)}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
