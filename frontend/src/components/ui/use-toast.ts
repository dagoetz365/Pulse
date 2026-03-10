import * as React from "react";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 4000;

type ToastVariant = "default" | "destructive";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type ToastAction =
  | { type: "ADD"; toast: Toast }
  | { type: "REMOVE"; id: string }
  | { type: "DISMISS"; id: string };

interface State {
  toasts: Toast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function reducer(state: State, action: ToastAction): State {
  switch (action.type) {
    case "ADD":
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "DISMISS":
      return {
        toasts: state.toasts.map((t) => (t.id === action.id ? { ...t, open: false } : t)),
      };
    case "REMOVE":
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
  }
}

let listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

function toast(props: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  dispatch({ type: "ADD", toast: { ...props, id } });

  const duration = props.duration ?? TOAST_REMOVE_DELAY;
  const timeout = setTimeout(() => dispatch({ type: "REMOVE", id }), duration);
  toastTimeouts.set(id, timeout);

  return {
    id,
    dismiss: () => {
      clearTimeout(toastTimeouts.get(id));
      toastTimeouts.delete(id);
      dispatch({ type: "REMOVE", id });
    },
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss: (id: string) => {
      clearTimeout(toastTimeouts.get(id));
      toastTimeouts.delete(id);
      dispatch({ type: "REMOVE", id });
    },
  };
}

export { useToast, toast };
